"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import type { UserSettings } from "../types"

interface SettingsProps {
  settings: UserSettings
  setSettings: (settings: UserSettings) => void
  onClose: () => void
}

// Add React.memo to optimize rendering
import React from "react"

// Wrap the component with React.memo
export const Settings = React.memo(function Settings({ settings, setSettings, onClose }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings })
  const [activeTab, setActiveTab] = useState("safety")

  const handleSafetySavingsChange = (index: number, amount: number) => {
    const updatedSafetySavings = [...localSettings.safetySavings]
    updatedSafetySavings[index] = {
      ...updatedSafetySavings[index],
      amount,
    }

    setLocalSettings({
      ...localSettings,
      safetySavings: updatedSafetySavings,
    })
  }

  const handleInterestRateTypeChange = (value: string) => {
    setLocalSettings({
      ...localSettings,
      interestRateType: value as "fixed" | "api" | "yearly",
    })
  }

  const handleFixedInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({
      ...localSettings,
      interestRate: Number(e.target.value) / 100,
    })
  }

  const handleRetirementAgeChange = (value: number[]) => {
    setLocalSettings({
      ...localSettings,
      retirementAge: value[0],
    })
  }

  const handleRetirementWithdrawalRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({
      ...localSettings,
      retirementWithdrawalRate: Number(e.target.value) / 100,
    })
  }

  const handleSaveSettings = () => {
    setSettings(localSettings)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="safety" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="safety">Safety Savings</TabsTrigger>
            <TabsTrigger value="interest">Interest Rates</TabsTrigger>
            <TabsTrigger value="retirement">Retirement</TabsTrigger>
          </TabsList>

          <TabsContent value="safety" className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {localSettings.safetySavings.map((safety, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>
                      Ages {safety.ageRange[0]} - {safety.ageRange[1]}
                    </CardTitle>
                    <CardDescription>Set your safety savings target for this age range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor={`safety-${index}`}>Safety Savings Amount ($)</Label>
                      <Input
                        id={`safety-${index}`}
                        type="number"
                        value={safety.amount}
                        onChange={(e) => handleSafetySavingsChange(index, Number(e.target.value))}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interest" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Interest Rate Configuration</CardTitle>
                <CardDescription>Configure how interest rates are applied to your investments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={localSettings.interestRateType} onValueChange={handleInterestRateTypeChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Use a fixed interest rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="api" id="api" />
                    <Label htmlFor="api">Load from official source</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly">Set manually for each year</Label>
                  </div>
                </RadioGroup>

                {localSettings.interestRateType === "fixed" && (
                  <div className="space-y-2">
                    <Label htmlFor="fixed-rate">Fixed Interest Rate (%)</Label>
                    <Input
                      id="fixed-rate"
                      type="number"
                      step="0.1"
                      value={(localSettings.interestRate * 100).toFixed(1)}
                      onChange={handleFixedInterestRateChange}
                    />
                  </div>
                )}

                {localSettings.interestRateType === "api" && (
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <div className="text-sm text-muted-foreground">
                      This feature will be available in a future update.
                    </div>
                  </div>
                )}

                {localSettings.interestRateType === "yearly" && (
                  <div className="space-y-2">
                    <Label>Yearly Interest Rates</Label>
                    <div className="text-sm text-muted-foreground">
                      This feature will be available in a future update.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retirement" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Retirement Planning</CardTitle>
                <CardDescription>Configure your retirement age and withdrawal rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Retirement Age: {localSettings.retirementAge}</Label>
                  <Slider
                    defaultValue={[65]}
                    min={50}
                    max={90}
                    step={1}
                    value={[localSettings.retirementAge]}
                    onValueChange={handleRetirementAgeChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawal-rate">Annual Withdrawal Rate (% of investments)</Label>
                  <Input
                    id="withdrawal-rate"
                    type="number"
                    step="0.1"
                    value={(localSettings.retirementWithdrawalRate * 100).toFixed(1)}
                    onChange={handleRetirementWithdrawalRateChange}
                  />
                  <p className="text-sm text-muted-foreground">The standard safe withdrawal rate is 4% per year.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

