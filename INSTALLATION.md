# Installation Guide - Golf Rangefinder for Fitbit Versa 3

This guide will walk you through installing the Golf Rangefinder app on your Fitbit Versa 3.

## Prerequisites

Before you begin, ensure you have:

- ✅ **Fitbit Versa 3** watch (fully charged, 80%+)
- ✅ **Windows PC** (you're already on Windows)
- ✅ **Fitbit account** (the one you use with your watch)
- ✅ **Node.js** installed (we'll check/install this)
- ✅ **Fitbit Developer account** (we'll create this - it's free!)

---

## Step 1: Create Fitbit Developer Account

1. Go to **https://dev.fitbit.com**
2. Click **"Sign In"** (top right)
3. Log in with your **same Fitbit account** you use for your watch
4. Accept the developer agreement
5. You now have a developer account! (It's free forever)

---

## Step 2: Install Node.js (If Not Already Installed)

### Check if you have Node.js:

Open PowerShell and run:
```powershell
node --version
```

If you see a version number (like `v18.17.0`), you're good! **Skip to Step 3**.

### If you DON'T have Node.js:

1. Go to **https://nodejs.org/**
2. Download the **LTS version** (Long Term Support)
3. Run the installer
4. Accept all defaults, click "Next" until complete
5. Restart your computer
6. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

---

## Step 3: Install Fitbit SDK

Open PowerShell (or your current terminal) and navigate to the golf-rangefinder folder:

```powershell
cd d:\GDRIVE\ANTIGRAVITY\golf-rangefinder
```

Install the Fitbit SDK and dependencies:

```powershell
npm install
```

This will take 1-2 minutes. You'll see progress as packages install.

---

## Step 4: Enable Developer Bridge on Your Versa 3

This allows your computer to communicate with your watch.

### On Your Watch:

1. Wake up your Versa 3
2. Swipe left to access **Settings**
3. Scroll down to **About**
4. Tap **About** multiple times (keep tapping)
5. You'll see **"Developer Mode"** or **"Developer Bridge"**
6. Tap to turn it **ON**
7. Your watch will show a number/code

### Keep your watch nearby - you'll need it connected!

---

## Step 5: Build the App

In PowerShell (in the golf-rangefinder folder):

```powershell
npm run build
```

This compiles your app. Should take 10-30 seconds.

You should see:
```
[...build output...]
Build succeeded
```

---

## Step 6: Connect and Install to Your Watch

### Start the Fitbit CLI:

```powershell
npx fitbit
```

You'll see a menu with options.

### Connect Your Watch:

1. Make sure **Developer Bridge is ON** on your watch
2. Make sure your watch is **on the same WiFi** as your computer
3. In the Fitbit CLI, select **"Connect Device"** (or similar)
4. Your watch should appear in the list
5. Select your**Versa 3**

### Install the App:

1. In the CLI, select **"Install"** or **"Install App"**
2. Wait for the transfer (10-30 seconds)
3. The app will automatically launch on your watch!

---

## Step 7: First Launch

### On Your Watch:

1. The Golf Rangefinder app should open automatically
2. You'll see a **GPS permission request** - tap **"Allow"**
3. The main screen appears with "--" for all distances (normal!)
4. GPS status shows "Searching..."

### Go Outside:

1. Step outside with a clear view of the sky
2. Wait 20-30 seconds
3. GPS status will change to "Good" or "Excellent"
4. You're ready to use the app!

---

## Quick Test (Optional)

### Test the App Without Going to a Golf Course:

1. With GPS locked (outdoors), tap **MARK**
2. Tap **"Mark Front"**  
3. Your watch vibrates - position saved!
4. Walk 20-30 steps away
5. Tap **BACK** to return to main screen
6. You should now see a distance (e.g., "54 yd") instead of "--"

**It works!** 🎉

---

## Troubleshooting Installation

### "npm: command not found"
**Solution:** Node.js isn't installed. Go back to Step 2.

### "Developer Bridge not found"
**Solution:**  
- Make sure you tapped "About" enough times on your watch
- Try restarting your watch
- Update your Fitbit OS (through the Fitbit mobile app)

### "No devices found"
**Solution:**
- Ensure Developer Bridge is ON on your watch
- Make sure watch and computer are on the **same WiFi network**
- Try restarting the Fitbit CLI (`npx fitbit`)
- Restart your watch

### "Build failed"
**Solution:**
- Make sure all files were downloaded properly
- Try deleting `node_modules` folder and running `npm install` again
- Check that you're in the correct directory

### "Permission denied" errors
**Solution:** Run PowerShell as Administrator (right-click PowerShell → "Run as Administrator")

---

## Updating the App

If you make changes to the code or want to reinstall:

```powershell
cd d:\GDRIVE\ANTIGRAVITY\golf-rangefinder
npm run build
npx fitbit
# Select your watch and choose "Install"
```

---

## Uninstalling the App

### From Your Watch:

1. Long-press the Golf Rangefinder app icon
2. Tap "Uninstall" or the X button
3. Confirm

OR

### Using Fitbit Mobile App:

1. Open Fitbit app on your phone
2. Tap your profile picture
3. Tap your Versa 3
4. Tap "Apps"
5. Find "Golf Rangefinder"
6. Tap "Remove"

---

## Next Steps

Once installed:

1. **Read the [USER_GUIDE.md](USER_GUIDE.md)** - Learn how to use the app
2. **Go to a golf course** - Mark your first course
3. **Play golf!** - Enjoy real-time distance tracking

---

## Development Mode

Want to keep developing or debugging?

### Live Development:

```powershell
npx fitbit
# Select "Connect Device"
# Make code changes
# Select "Build" to rebuild
# Changes appear automatically on watch
```

### View Console Logs:

In the Fitbit CLI, select "Console" to see `console.log()` output from your app.

---

## Publishing to Fitbit Gallery (Optional)

Want to share your app with other Fitbit users?

1. Go to https://studio.fitbit.com
2. Upload your app
3. Submit for review
4. Once approved, anyone can download it!

*Note: This is optional - your app works perfectly as a sideloaded app!*

---

## Support

- **Technical Issues:** Check README.md
- **Usage Questions:** Read USER_GUIDE.md
- **Fitbit SDK Docs:** https://dev.fitbit.com/build/reference/
- **Developer Forums:** https://community.fitbit.com/t5/SDK-Development/bd-p/sdk

---

## You're All Set! 🎉

Your Fitbit Versa 3 is now a fully functional golf rangefinder!

**Next:** Read the [USER_GUIDE.md](USER_GUIDE.md) to learn how to mark courses and use the app during rounds.

**Happy golfing!** ⛳🏌️‍♂️
