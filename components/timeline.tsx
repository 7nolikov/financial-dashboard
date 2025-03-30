"use client"

import React from "react"

import { useState, useRef, useEffect, type MouseEvent } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "../utils/format"
import type { FinancialData, UserSettings, Milestone } from "../types"

interface TimelineProps {
  financialData: FinancialData
  settings: UserSettings
  zoomLevel: number
  onZoomChange: (newZoomLevel: number) => void
  visibleRange: [number, number]
  onVisibleRangeChange: (newRange: [number, number]) => void
  milestones: Milestone[]
  onAddMilestone: (year: number, label: string) => void
  dateOfBirth?: Date
  activeTab: string
}

export function Timeline({
  financialData,
  settings,
  zoomLevel,
  onZoomChange,
  visibleRange,
  onVisibleRangeChange,
  milestones,
  onAddMilestone,
  dateOfBirth,
  activeTab,
}: TimelineProps) {
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false)
  const [newMilestoneYear, setNewMilestoneYear] = useState<number | null>(null)
  const [newMilestoneLabel, setNewMilestoneLabel] = useState("")
  const [hoveredMilestone, setHoveredMilestone] = useState<Milestone | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // Wrap the processFinancialData function in React.useCallback to prevent unnecessary recreations
  const processFinancialData = React.useCallback(
    (financialData: FinancialData, settings: UserSettings, dateOfBirth?: Date) => {
      const result = []
      const currentYear = new Date().getFullYear()
      const birthYear = dateOfBirth ? dateOfBirth.getFullYear() : currentYear - 30

      let cumulativeIncome = 0
      let cumulativeExpenses = 0
      let cumulativeInvestments = 0
      let netWorth = 0

      for (let age = 0; age <= 100; age++) {
        const year = birthYear + age
        const yearData = { age, year, income: 0, expenses: 0, investments: 0, netWorth: 0, safetySavings: 0 }

        // Get safety savings for this age
        const safetySavingsConfig = settings.safetySavings.find((s) => age >= s.ageRange[0] && age <= s.ageRange[1])
        yearData.safetySavings = safetySavingsConfig?.amount || 0

        // Process income
        financialData.income.forEach((income) => {
          if (income.startAge <= age && (income.endAge === null || income.endAge >= age)) {
            if (income.recurring) {
              yearData.income += income.amount
              cumulativeIncome += income.amount
            } else if (income.startAge === age) {
              yearData.income += income.amount
              cumulativeIncome += income.amount
            }
          }
        })

        // Process expenses
        financialData.expenses.forEach((expense) => {
          if (expense.startAge <= age && (expense.endAge === null || expense.endAge >= age)) {
            if (expense.recurring) {
              yearData.expenses += expense.amount
              cumulativeExpenses += expense.amount
            } else if (expense.startAge === age) {
              yearData.expenses += expense.amount
              cumulativeExpenses += expense.amount
            }
          }
        })

        // Process investments with compound interest
        financialData.investments.forEach((investment) => {
          if (investment.startAge <= age && (investment.endAge === null || investment.endAge >= age)) {
            // Get interest rate for this year
            let interestRate = 0
            if (settings.interestRateType === "fixed") {
              interestRate = settings.interestRate
            } else if (settings.interestRateType === "yearly") {
              interestRate = settings.yearlyInterestRates[age] || 0
            }

            if (investment.recurring) {
              yearData.investments += investment.amount
              cumulativeInvestments += investment.amount

              // Apply compound interest
              if (age > 0) {
                cumulativeInvestments *= 1 + interestRate
              }
            } else if (investment.startAge === age) {
              yearData.investments += investment.amount
              cumulativeInvestments += investment.amount
            }
          }
        })

        // Handle retirement withdrawals
        if (age >= settings.retirementAge) {
          const withdrawalAmount = cumulativeInvestments * settings.retirementWithdrawalRate
          yearData.expenses += withdrawalAmount
          cumulativeInvestments -= withdrawalAmount
        }

        // Calculate net worth
        netWorth = cumulativeIncome - cumulativeExpenses + cumulativeInvestments
        yearData.netWorth = netWorth

        result.push(yearData)
      }

      return result
    },
    [],
  )

  // Memoize the chartData calculation to prevent unnecessary recalculations
  const chartData = React.useMemo(
    () => processFinancialData(financialData, settings, dateOfBirth),
    [financialData, settings, dateOfBirth, processFinancialData],
  )

  // Memoize the visibleData calculation based on the visible range
  const visibleData = React.useMemo(
    () => chartData.slice(visibleRange[0], visibleRange[1] + 1),
    [chartData, visibleRange],
  )

  // Handle wheel event for zooming - centered on cursor position
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    if (!chartRef.current) return

    // Get chart dimensions
    const rect = chartRef.current.getBoundingClientRect()
    const chartWidth = rect.width

    // Calculate cursor position as a percentage of chart width
    const cursorX = e.clientX - rect.left
    const cursorPercent = cursorX / chartWidth

    // Calculate current visible range width
    const currentRangeWidth = visibleRange[1] - visibleRange[0]

    // Calculate new zoom level
    const delta = e.deltaY * 0.01 // Inverted as requested
    const newZoomLevel = Math.max(1, Math.min(100, zoomLevel + delta * 5))

    // Calculate new range width based on zoom level
    const newRangeWidth = Math.ceil(chartData.length * (newZoomLevel / 100))

    // Calculate new range centered on cursor position
    let newStart = Math.round(visibleRange[0] + (currentRangeWidth - newRangeWidth) * cursorPercent)
    newStart = Math.max(0, Math.min(chartData.length - newRangeWidth, newStart))
    const newEnd = Math.min(chartData.length - 1, newStart + newRangeWidth)

    // Update zoom level and visible range
    onZoomChange(newZoomLevel)
    onVisibleRangeChange([newStart, newEnd])
  }

  // Handle click to add milestone - only if dashboard tab is active and click is on the chart area
  const handleChartClick = (e: MouseEvent) => {
    if (!chartRef.current || activeTab !== "dashboard") return

    const rect = chartRef.current.getBoundingClientRect()

    // Check if the click is within the chart area
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const x = e.clientX - rect.left
      const width = rect.width

      // Calculate year based on click position
      const yearIndex = Math.floor((x / width) * visibleData.length) + visibleRange[0]
      const year = chartData[yearIndex]?.age || 0

      setNewMilestoneYear(year)
      setShowMilestoneDialog(true)
    }
  }

  // Add milestone when dialog is confirmed
  const confirmAddMilestone = () => {
    if (newMilestoneYear !== null && newMilestoneLabel.trim()) {
      onAddMilestone(newMilestoneYear, newMilestoneLabel)
      setShowMilestoneDialog(false) // Close the dialog
      setNewMilestoneLabel("") // Reset the label
      setNewMilestoneYear(null) // Reset the year
    }
  }

  // Update the useEffect hook to prevent infinite loops
  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault()
    }

    timeline.addEventListener("wheel", preventScroll, { passive: false })
    return () => {
      timeline.removeEventListener("wheel", preventScroll)
    }
  }, []) // Empty dependency array to run only once on mount

  // Combine all milestones including retirement
  const allMilestones = React.useMemo(() => {
    // Check if retirement is already in the milestones
    const hasRetirement = milestones.some((m) => m.label === "Retirement" && m.year === settings.retirementAge)

    if (!hasRetirement) {
      // Add retirement as a milestone with the same styling
      return [...milestones, { id: -1, year: settings.retirementAge, label: "Retirement" }]
    }

    return milestones
  }, [milestones, settings.retirementAge])

  return (
    <div ref={timelineRef} className="h-[500px] w-full" onWheel={handleWheel}>
      {/* Centered legend */}
      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-sm">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Investments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <span className="text-sm">Net Worth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
            <span className="text-sm">Safety Savings</span>
          </div>
        </div>
      </div>

      <div ref={chartRef} onClick={handleChartClick} className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }} // Increased margins to prevent overlap
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" />
            <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Age: ${label}`} />

            {/* Safety savings reference line */}
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />

            {/* Milestones - including retirement */}
            {allMilestones.map((milestone) => (
              <ReferenceLine
                key={milestone.id}
                x={milestone.year}
                stroke="#666"
                strokeDasharray="5 5"
                label={{
                  value: milestone.label,
                  position: "top",
                  fill: hoveredMilestone?.id === milestone.id ? "#000" : "transparent",
                  fontSize: 12,
                  fontWeight: "bold",
                  dy: -10, // Move label up to avoid overlap with legend
                }}
                onMouseOver={() => setHoveredMilestone(milestone)}
                onMouseOut={() => setHoveredMilestone(null)}
              />
            ))}

            {/* Financial data areas */}
            <Area type="monotone" dataKey="income" stackId="1" stroke="#4ade80" fill="#4ade80" fillOpacity={0.6} />
            <Area type="monotone" dataKey="expenses" stackId="2" stroke="#f87171" fill="#f87171" fillOpacity={0.6} />
            <Area type="monotone" dataKey="investments" stackId="3" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} />
            <Area type="monotone" dataKey="netWorth" stackId="4" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
            <Area
              type="monotone"
              dataKey="safetySavings"
              stackId="5"
              stroke="#fb923c"
              fill="#fb923c"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestone Dialog */}
      <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestone-year" className="text-right">
                Year
              </Label>
              <Input
                id="milestone-year"
                value={newMilestoneYear || ""}
                onChange={(e) => setNewMilestoneYear(Number(e.target.value))}
                className="col-span-3"
                type="number"
                min="0"
                max="100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestone-label" className="text-right">
                Label
              </Label>
              <Input
                id="milestone-label"
                value={newMilestoneLabel}
                onChange={(e) => setNewMilestoneLabel(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Graduation, New Job, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMilestoneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddMilestone}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

