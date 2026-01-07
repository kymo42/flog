# Golf Rangefinder for Fitbit Versa 3

A GPS-based golf rangefinder app for your Fitbit Versa 3 smartwatch. Works on ANY golf course worldwide with manual hole marking.

## Features

- ✅ **Real-time GPS Distance Measurement** - See distances to front, middle, and back of green
- ✅ **Manual Hole Marking** - Mark tee boxes, greens, and hazards as you play
- ✅ **18-Hole Support** - Full round tracking for any golf course
- ✅ **Multiple Course Storage** - Save all your favorite courses locally
- ✅ **No Subscriptions** - Completely free, no paid services required
- ✅ **Works Anywhere** - Use on any golf course in the world
- ✅ **Yards or Meters** - Choose your preferred distance units
- ✅ **Battery Efficient** - Optimized GPS usage for 4+ hour rounds

## How to Use

### First Time Setup

1. **Install the app** on your Fitbit Versa 3 using the Fitbit Developer Bridge or Fitbit Gallery
2. **Start the app** and allow GPS permissions
3. **Go to a golf course** and wait for GPS lock (green status)

### Marking a Course

1. Stand at the **tee box** and tap **MARK** → **Mark Tee**
2. Walk to the green and mark **Front**, **Middle**, and **Back** positions
3. Optionally mark hazards (bunkers, water) for reference
4. Repeat for all 18 holes (you can do this during your first round)

### During a Round

1. The app shows real-time distances to:
   - **Front of green**
   - **Middle of green**  
   - **Back of green**
2. Use **◄ ►** buttons to navigate between holes
3. GPS updates automatically as you move

### Managing Courses

- Courses are saved automatically on your watch
- Store unlimited courses with no cloud storage needed
- Each course remembers all hole positions

## Installation

### Prerequisites

- Fitbit Versa 3 watch
- Fitbit account
- Node.js installed on your computer
- Fitbit Developer account (free at https://dev.fitbit.com)

### Steps

1. **Clone or download this project**

2. **Install dependencies:**
   ```bash
   cd golf-rangefinder
   npm install
   ```

3. **Build the app:**
   ```bash
   npm run build
   ```

4. **Enable Developer Bridge on your Versa 3:**
   - Go to Settings → About → Developer Mode
   - Turn on Developer Bridge

5. **Connect and install:**
   ```bash
   npx fitbit
   ```
   - Follow prompts to connect to your watch
   - App will be installed automatically

## Tips for Best Results

- **GPS Accuracy**: Start the app with a clear view of the sky
- **Battery**: Charge your watch to 80%+ before rounds
- **First Lock**: GPS may take 20-30 seconds on first launch
- **Marking Strategy**: Mark holes during practice rounds or as you play
- **Accuracy**: Stand still when marking positions for best precision

## Troubleshooting

**GPS won't lock:**
- Ensure you're outdoors with clear sky view
- Sync your Fitbit before starting (improves GPS acquisition)
- Wait up to 60 seconds for initial lock

**App won't install:**
- Verify Fitbit Developer Bridge is enabled
- Check your Fitbit account is logged in
- Try restarting your watch

**Distances seem wrong:**
- Check GPS status (should show "Good" or "Excellent")
- Verify you marked the correct positions
- Re-mark positions if needed

## Development

Want to customize the app? Here's the structure:

```
golf-rangefinder/
├── app/              # Main watch app
│   ├── index.js      # App logic
│   ├── gps.js        # GPS management
│   ├── distance.js   # Distance calculations
│   └── storage.js    # Data storage
├── resources/        # UI files
│   ├── index.view    # SVG UI layout
│   └── styles.css    # Styling
├── companion/        # Phone companion app
│   └── index.js      # Settings sync
├── settings/         # Settings UI
│   └── index.jsx     # Settings page
└── package.json      # Project config
```

## License

MIT License - Free to use and modify!

## Credits

Built with the Fitbit SDK. Distance calculations use the Haversine formula for GPS accuracy.

---

**Enjoy your rounds! ⛳**
