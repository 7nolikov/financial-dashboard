"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import type { FinancialData, UserSettings, FinancialEntry } from "../types"

interface DataEntryProps {
  financialData: FinancialData
  setFinancialData: (data: FinancialData) => void
  settings: UserSettings
}

export function DataEntry({ financialData, setFinancialData, settings }: DataEntryProps) {
  const [activeTab, setActiveTab] = useState("income")
  const [newEntry, setNewEntry] = useState<Partial<FinancialEntry>>({
    id: Date.now(),
    name: "",
    amount: 0,
    startAge: 25,
    endAge: null,
    recurring: true,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setNewEntry({
      ...newEntry,
      [name]: type === "number" ? Number(value) : value,
    })
  }

  const handleSwitchChange = (checked: boolean) => {
    setNewEntry({
      ...newEntry,
      recurring: checked,
    })
  }

  const handleSliderChange = (value: number[]) => {
    setNewEntry({
      ...newEntry,
      startAge: value[0],
    })
  }

  const handleEndAgeChange = (value: number[]) => {
    setNewEntry({
      ...newEntry,
      endAge: value[0] === 100 ? null : value[0],
    })
  }

  const handleAddEntry = () => {
    if (!newEntry.name || newEntry.amount === 0) return

    const entry = {
      id: Date.now(),
      name: newEntry.name || "",
      amount: newEntry.amount || 0,
      startAge: newEntry.startAge || 0,
      endAge: newEntry.endAge,
      recurring: newEntry.recurring || false,
    } as FinancialEntry

    const updatedData = { ...financialData }

    if (activeTab === "income") {
      updatedData.income = [...updatedData.income, entry]
    } else if (activeTab === "expenses") {
      updatedData.expenses = [...updatedData.expenses, entry]
    } else if (activeTab === "investments") {
      updatedData.investments = [...updatedData.investments, entry]
    }

    setFinancialData(updatedData)

    // Reset form
    setNewEntry({
      id: Date.now(),
      name: "",
      amount: 0,
      startAge: 25,
      endAge: null,
      recurring: true,
    })
  }

  const handleDeleteEntry = (id: number) => {
    const updatedData = { ...financialData }

    if (activeTab === "income") {
      updatedData.income = updatedData.income.filter((item) => item.id !== id)
    } else if (activeTab === "expenses") {
      updatedData.expenses = updatedData.expenses.filter((item) => item.id !== id)
    } else if (activeTab === "investments") {
      updatedData.investments = updatedData.investments.filter((item) => item.id !== id)
    }

    setFinancialData(updatedData)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="income" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Income</CardTitle>
              <CardDescription>Add your income sources like salary, side hustles, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Salary, Freelance"
                    value={newEntry.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Annual Amount ($)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0"
                    value={newEntry.amount || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Age: {newEntry.startAge}</Label>
                <Slider
                  defaultValue={[25]}
                  max={100}
                  step={1}
                  value={[newEntry.startAge || 0]}
                  onValueChange={handleSliderChange}
                />
              </div>

              <div className="space-y-2">
                <Label>End Age: {newEntry.endAge === null ? "Lifetime" : newEntry.endAge}</Label>
                <Slider
                  defaultValue={[100]}
                  max={100}
                  step={1}
                  value={[newEntry.endAge === null ? 100 : newEntry.endAge]}
                  onValueChange={handleEndAgeChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="recurring" checked={newEntry.recurring} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="recurring">Recurring (yearly)</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddEntry}>Add Income</Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financialData.income.map((income) => (
              <Card key={income.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{income.name}</CardTitle>
                  <CardDescription>
                    {income.recurring ? "Recurring" : "One-time"} | Ages {income.startAge} -{" "}
                    {income.endAge === null ? "Lifetime" : income.endAge}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${income.amount.toLocaleString()}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" onClick={() => handleDeleteEntry(income.id)}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Expense</CardTitle>
              <CardDescription>Add your expenses like rent, groceries, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Rent, Groceries"
                    value={newEntry.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Annual Amount ($)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0"
                    value={newEntry.amount || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Age: {newEntry.startAge}</Label>
                <Slider
                  defaultValue={[25]}
                  max={100}
                  step={1}
                  value={[newEntry.startAge || 0]}
                  onValueChange={handleSliderChange}
                />
              </div>

              <div className="space-y-2">
                <Label>End Age: {newEntry.endAge === null ? "Lifetime" : newEntry.endAge}</Label>
                <Slider
                  defaultValue={[100]}
                  max={100}
                  step={1}
                  value={[newEntry.endAge === null ? 100 : newEntry.endAge]}
                  onValueChange={handleEndAgeChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="recurring" checked={newEntry.recurring} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="recurring">Recurring (yearly)</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddEntry}>Add Expense</Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financialData.expenses.map((expense) => (
              <Card key={expense.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{expense.name}</CardTitle>
                  <CardDescription>
                    {expense.recurring ? "Recurring" : "One-time"} | Ages {expense.startAge} -{" "}
                    {expense.endAge === null ? "Lifetime" : expense.endAge}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${expense.amount.toLocaleString()}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" onClick={() => handleDeleteEntry(expense.id)}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Investment</CardTitle>
              <CardDescription>Add your investments like 401k, stocks, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., 401k, Stocks"
                    value={newEntry.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Annual Amount ($)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0"
                    value={newEntry.amount || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Age: {newEntry.startAge}</Label>
                <Slider
                  defaultValue={[25]}
                  max={100}
                  step={1}
                  value={[newEntry.startAge || 0]}
                  onValueChange={handleSliderChange}
                />
              </div>

              <div className="space-y-2">
                <Label>End Age: {newEntry.endAge === null ? "Lifetime" : newEntry.endAge}</Label>
                <Slider
                  defaultValue={[100]}
                  max={100}
                  step={1}
                  value={[newEntry.endAge === null ? 100 : newEntry.endAge]}
                  onValueChange={handleEndAgeChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="recurring" checked={newEntry.recurring} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="recurring">Recurring (yearly)</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddEntry}>Add Investment</Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financialData.investments.map((investment) => (
              <Card key={investment.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{investment.name}</CardTitle>
                  <CardDescription>
                    {investment.recurring ? "Recurring" : "One-time"} | Ages {investment.startAge} -{" "}
                    {investment.endAge === null ? "Lifetime" : investment.endAge}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${investment.amount.toLocaleString()}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" onClick={() => handleDeleteEntry(investment.id)}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

