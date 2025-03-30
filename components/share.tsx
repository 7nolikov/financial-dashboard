"use client"

import type React from "react"

import { useRef } from "react"
import { toPng } from "html-to-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "../utils/format"
import type { FinancialSummaryData } from "../types"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface ShareProps {
  dashboardRef: React.RefObject<HTMLDivElement>
  onClose: () => void
  summary: FinancialSummaryData
  chartData: any[]
}

export function Share({ dashboardRef, onClose, summary, chartData }: ShareProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const simplifiedChartData = chartData.filter((_, index) => index % 5 === 0) // Simplify data for preview

  const handleDownload = async () => {
    if (!dashboardRef.current) return

    try {
      const dataUrl = await toPng(dashboardRef.current, {
        quality: 0.95,
        backgroundColor: "white",
      })

      const link = document.createElement("a")
      link.download = `financial-dashboard-${new Date().toISOString().split("T")[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Share Your Financial Dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg p-6 bg-white" ref={previewRef}>
            <h2 className="text-2xl font-bold mb-4">My Financial Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Investments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalInvestments)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Net Worth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(summary.netWorth)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Preview */}
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simplifiedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                  <Area type="monotone" dataKey="netWorth" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-center text-muted-foreground">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Click the button below to download a snapshot of your financial dashboard. This will include your timeline
            and financial summary.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>Download Image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

