# Supabase Stock JSON Generator

This project is designed to fetch stock symbols from a Supabase database and generate JSON files containing details about each symbol, including total capital used and all PUT positions. The JSON files are named in the format **META.json** and will be updated if they already exist.

## Project Structure

```
supabase-stock-json-generator
├── src
│   ├── index.ts                # Entry point of the application
│   ├── services
│   │   ├── supabaseClient.ts   # Supabase client configuration
│   │   ├── ordersService.ts     # Service to fetch stock symbols from orders
│   │   ├── positionsService.ts   # Service to fetch PUT positions
│   │   └── jsonGenerator.ts     # Service to generate JSON files
│   ├── types
│   │   ├── index.ts            # Common types and interfaces
│   │   ├── orders.ts           # Interfaces related to order data
│   │   └── positions.ts         # Interfaces related to position data
│   └── utils
│       ├── fileHandler.ts       # Utility functions for file operations
│       └── logger.ts            # Logging functions
├── output                        # Directory for generated JSON files
│   └── .gitkeep                 # Keeps the output directory in version control
├── package.json                 # NPM configuration file
├── tsconfig.json                # TypeScript configuration file
├── .env.example                  # Example environment variables
└── README.md                    # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd supabase-stock-json-generator
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Supabase URL and service key.

4. **Run the application:**
   ```
   npm start
   ```

## Usage

The application will connect to your Supabase database, fetch all unique stock symbols from the `orders` table where `assetCategory = 'STK'`, and generate/update JSON files for each symbol in the `output` directory.

Each JSON file will contain:
- Symbol details
- Total capital used
- All PUT positions associated with the symbol

## Logging

The application includes logging functionality to help track the process. Logs will be printed to the console for both informational messages and errors.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.