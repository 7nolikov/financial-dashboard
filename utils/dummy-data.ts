import type { FinancialData } from "../types"

export function generateDummyData(): FinancialData {
  return {
    income: [
      {
        id: 1,
        name: "Salary",
        amount: 65000,
        startAge: 22,
        endAge: 65,
        recurring: true,
      },
      {
        id: 2,
        name: "Side Hustle",
        amount: 12000,
        startAge: 25,
        endAge: 40,
        recurring: true,
      },
      {
        id: 3,
        name: "Inheritance",
        amount: 50000,
        startAge: 35,
        endAge: null,
        recurring: false,
      },
    ],
    expenses: [
      {
        id: 1,
        name: "Living Expenses",
        amount: 45000,
        startAge: 22,
        endAge: null,
        recurring: true,
      },
      {
        id: 2,
        name: "Mortgage",
        amount: 18000,
        startAge: 30,
        endAge: 60,
        recurring: true,
      },
      {
        id: 3,
        name: "Car Purchase",
        amount: 30000,
        startAge: 25,
        endAge: null,
        recurring: false,
      },
      {
        id: 4,
        name: "Healthcare",
        amount: 8000,
        startAge: 65,
        endAge: null,
        recurring: true,
      },
    ],
    investments: [
      {
        id: 1,
        name: "401k",
        amount: 6500,
        startAge: 22,
        endAge: 65,
        recurring: true,
      },
      {
        id: 2,
        name: "Roth IRA",
        amount: 3000,
        startAge: 30,
        endAge: 65,
        recurring: true,
      },
      {
        id: 3,
        name: "Stock Investment",
        amount: 10000,
        startAge: 30,
        endAge: null,
        recurring: false,
      },
    ],
  }
}

