# Financial Life Tracker

A comprehensive financial planning application that helps you visualize your financial future with interactive timeline projections.

## 🚀 Features

### Core Functionality

- **Interactive Timeline**: Visualize your financial trajectory from age 0 to 100
- **Comprehensive Tracking**: Income, expenses, investments, loans, and retirement planning
- **Inflation Modeling**: Both nominal and real (inflation-adjusted) projections
- **Safety Planning**: Emergency fund and safety savings calculations
- **Milestone Tracking**: Mark important life events on your timeline

### Advanced Features

- **Demo Presets**: Pre-configured scenarios (Worker, Investor, Businessman, Loaner)
- **Real-time Calculations**: Month-by-month financial projections
- **Interactive Chart**: Zoom, pan, and explore your financial timeline
- **Export Functionality**: Share your financial plan as JPG images
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Visx (D3-based)
- **State Management**: Zustand with persistence
- **Testing**: Vitest + Playwright
- **Deployment**: GitHub Pages

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/7nolikov/financial-dashboard.git
cd financial-dashboard

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 🎯 Usage

### Getting Started

1. **Set Your Birth Date**: Enter your date of birth to align the timeline with your actual age
2. **Choose a Preset**: Start with one of the demo presets or begin with a blank slate
3. **Add Your Data**: Use the Data Entry tabs to add your financial information
4. **Configure Settings**: Set safety savings rules and interest rates
5. **Analyze Results**: View your financial projections and adjust as needed

### Data Entry

- **Income**: Add salary, freelance, and other income sources
- **Expenses**: Track rent, utilities, groceries, and other monthly costs
- **Investments**: Set up 401k, IRA, and other investment contributions
- **Retirement**: Configure retirement age and withdrawal rates

### Settings

- **Safety Savings**: Set emergency fund targets for different life stages
- **Interest Rates**: Configure expected investment returns
- **Inflation**: Adjust inflation rate for realistic projections

## 🔧 Development

### Project Structure

```
src/
├── components/          # React components
│   ├── DataEntry/       # Data entry forms
│   ├── Settings/        # Settings panels
│   ├── Timeline/        # Chart components
│   ├── Share/           # Export functionality
│   └── Help/            # Help and documentation
├── state/               # Zustand store and selectors
├── lib/                 # Utility functions
└── main.tsx            # Application entry point
```

### Key Components

- **AreaChart**: Main timeline visualization with Visx
- **DataEntryPanel**: Forms for adding financial data
- **SettingsPanel**: Configuration options
- **ErrorBoundary**: Error handling and recovery
- **HelpModal**: Comprehensive help and guidance

### State Management

The application uses Zustand for state management with:

- **Persistence**: Automatic saving to localStorage
- **Migrations**: Versioned state updates
- **Selectors**: Computed financial projections

## 🧪 Testing

```bash
# Run unit tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run end-to-end tests
pnpm e2e

# Lint and type-check
pnpm lint
pnpm typecheck
```

## 🚀 Deployment

The application is automatically deployed to GitHub Pages via GitHub Actions:

1. **Push to main branch**: Triggers automatic build and deployment
2. **Build Process**: Runs tests, builds production bundle
3. **Deployment**: Deploys to GitHub Pages at `https://7nolikov.github.io/financial-dashboard/`

### Manual Deployment

```bash
# Build the project
pnpm build

# The dist/ folder contains the production build
# Deploy the contents to your hosting provider
```

## 📊 Financial Calculations

### Core Calculations

- **Net Worth**: Assets - Liabilities over time
- **Investment Growth**: Compound interest with monthly contributions
- **Inflation Adjustment**: Both nominal and real value projections
- **Retirement Withdrawals**: Systematic withdrawal strategies
- **Safety Savings**: Emergency fund calculations

### Assumptions

- Monthly compounding for investments
- Fixed interest rates (configurable)
- Linear expense growth with inflation
- Retirement withdrawals start at specified age

## 🔒 Security & Privacy

- **Local Storage**: All data is stored locally in your browser
- **No Server**: No data is sent to external servers
- **Privacy First**: Your financial data never leaves your device
- **Open Source**: Full source code available for review

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commits
- Add tests for new features
- Ensure responsive design
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Charts powered by [Visx](https://visx.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)

## 📞 Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Check the help modal in the application
- Review the documentation in the `/docs` folder

---

**Disclaimer**: This tool is for planning purposes only and does not constitute financial advice. Always consult with a qualified financial advisor for important financial decisions.
