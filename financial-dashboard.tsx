"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "./components/date-picker"
import { Timeline } from "./components/timeline"
import { FinancialSummary } from "./components/financial-summary"
import { DataEntry } from "./components/data-entry"
import { Settings } from "./components/settings"
import { Share } from "./components/share"
import { generateDummyData } from "./utils/dummy-data"
import { useLocalStorage } from "./hooks/use-local-storage"
import type { FinancialData, UserSettings, Milestone } from "./types"

export default function FinancialDashboard() {
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(new Date(1990, 0, 1))
  const [activeTab, setActiveTab] = useState("dashboard")
  const [zoomLevel, setZoomLevel] = useState<number>(100) // 100 years view by default
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 100]) // Start with full range
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Load data from local storage or use dummy data
  const [financialData, setFinancialData] = useLocalStorage<FinancialData>("financial-data", generateDummyData())

  const [settings, setSettings] = useLocalStorage<UserSettings>("user-settings", {
    safetySavings: [
      { ageRange: [0, 20], amount: 5000 },
      { ageRange: [21, 40], amount: 15000 },
      { ageRange: [41, 60], amount: 30000 },
      { ageRange: [61, 100], amount: 50000 },
    ],
    interestRateType: "fixed",
    interestRate: 0.05,
    yearlyInterestRates: Array(101).fill(0.05),
    retirementAge: 65,
    retirementWithdrawalRate: 0.04,
  })

  // Initial milestones
  const defaultMilestones: Milestone[] = [
    { id: 1, year: 22, label: "Graduation" },
    { id: 2, year: 30, label: "Buying a House" },
  ]

  const [milestones, setMilestones] = useState<Milestone[]>(defaultMilestones)

  const dashboardRef = useRef<HTMLDivElement>(null)

  // Process financial data for the chart
  const processFinancialData = useMemo(() => {
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
  }, [financialData, settings, dateOfBirth])

  // Calculate financial summaries based on the visible range
  const financialSummary = useMemo(() => {
    // Get the visible data
    const visibleData = processFinancialData.slice(visibleRange[0], visibleRange[1] + 1)

    // Calculate totals for the visible range
    let totalIncome = 0
    let totalExpenses = 0
    let totalInvestments = 0
    let netWorth = 0

    // Use the last data point for net worth
    if (visibleData.length > 0) {
      const lastPoint = visibleData[visibleData.length - 1]
      netWorth = lastPoint.netWorth

      // Sum up the values for the visible range
      visibleData.forEach((data) => {
        totalIncome += data.income
        totalExpenses += data.expenses
        // For investments, we'll use the final value rather than summing
      })

      // For investments, use the accumulated value at the end of the range
      totalInvestments = visibleData[visibleData.length - 1].investments
    }

    // Calculate growth percentages
    // For simplicity, we'll compare the first and last points in the visible range
    let incomeGrowth = 0
    let expensesGrowth = 0
    let investmentsGrowth = 0
    let netWorthGrowth = 0

    if (visibleData.length > 1) {
      const firstPoint = visibleData[0]
      const lastPoint = visibleData[visibleData.length - 1]

      // Calculate growth rates
      if (firstPoint.income > 0) {
        incomeGrowth = ((lastPoint.income - firstPoint.income) / firstPoint.income) * 100
      }

      if (firstPoint.expenses > 0) {
        expensesGrowth = ((lastPoint.expenses - firstPoint.expenses) / firstPoint.expenses) * 100
      }

      if (firstPoint.investments > 0) {
        investmentsGrowth = ((lastPoint.investments - firstPoint.investments) / firstPoint.investments) * 100
      }

      if (firstPoint.netWorth > 0) {
        netWorthGrowth = ((lastPoint.netWorth - firstPoint.netWorth) / firstPoint.netWorth) * 100
      }
    }

    return {
      totalIncome,
      totalExpenses,
      totalInvestments,
      netWorth,
      incomeGrowth,
      expensesGrowth,
      investmentsGrowth,
      netWorthGrowth,
    }
  }, [processFinancialData, visibleRange])

  // Auto-save when data changes
  useEffect(() => {
    // Load milestones from local storage
    const savedMilestones = localStorage.getItem("milestones")
    if (savedMilestones) {
      setMilestones(JSON.parse(savedMilestones))
    } else {
      // Save default milestones to local storage
      localStorage.setItem("milestones", JSON.stringify(defaultMilestones))
    }

    // Load date of birth from local storage
    const savedDateOfBirth = localStorage.getItem("dateOfBirth")
    if (savedDateOfBirth) {
      setDateOfBirth(new Date(savedDateOfBirth))
    }
  }, []) // Empty dependency array to run only once on mount

  const handleAddMilestone = (year: number, label: string) => {
    const newMilestone = { year, label, id: Date.now() }
    const updatedMilestones = [...milestones, newMilestone]
    setMilestones(updatedMilestones)

    // Save to local storage
    localStorage.setItem("milestones", JSON.stringify(updatedMilestones))
  }

  const handleZoomChange = (newZoomLevel: number) => {
    setZoomLevel(Math.max(1, Math.min(100, newZoomLevel)))
  }

  const handleVisibleRangeChange = (newRange: [number, number]) => {
    setVisibleRange(newRange)
  }

  const resetZoom = () => {
    setZoomLevel(100)
    setVisibleRange([0, 100])
  }

  const handleDateOfBirthChange = (date: Date | undefined) => {
    setDateOfBirth(date)
    // Update in local storage
    if (date) {
      localStorage.setItem("dateOfBirth", date.toISOString())
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl" ref={dashboardRef}>
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="data-entry">Data Entry</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <DatePicker date={dateOfBirth} onDateChange={handleDateOfBirthChange} label="Date of Birth" />
            <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
              Settings
            </Button>
            <Button onClick={() => setShowShareModal(true)}>Share</Button>
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FinancialSummary summary={financialSummary} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 relative">
              <Timeline
                financialData={financialData}
                settings={settings}
                zoomLevel={zoomLevel}
                onZoomChange={handleZoomChange}
                visibleRange={visibleRange}
                onVisibleRangeChange={handleVisibleRangeChange}
                milestones={milestones}
                onAddMilestone={handleAddMilestone}
                dateOfBirth={dateOfBirth}
                activeTab={activeTab}
              />
              <Button variant="outline" size="sm" className="absolute top-4 right-4" onClick={resetZoom}>
                Reset Zoom
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-entry">
          <DataEntry financialData={financialData} setFinancialData={setFinancialData} settings={settings} />
        </TabsContent>
      </Tabs>

      {showSettingsModal && (
        <Settings settings={settings} setSettings={setSettings} onClose={() => setShowSettingsModal(false)} />
      )}

      {showShareModal && (
        <Share
          dashboardRef={dashboardRef}
          onClose={() => setShowShareModal(false)}
          summary={financialSummary}
          chartData={processFinancialData}
        />
      )}
    </div>
  )
}

