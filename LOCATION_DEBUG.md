# Live Location Debugging Guide

## How to Test Live Location Feature

1. **Open the location picker dialog** in your app
2. **Click "Use My Current Location"** button
3. **Check browser console** for these logs:
   - `Live location received: { latitude: X, longitude: Y, accuracy: Z }`
   - `Reverse geocoding result: { ... }`

## Common Issues & Solutions

### Issue 1: Wrong Location Displayed
**Possible Causes:**
- Browser using IP-based location (less accurate)
- GPS not enabled on device
- Indoor location with poor GPS signal

**Solutions:**
- Enable GPS/Location Services on your device
- Try outdoors for better GPS signal
- Check browser location permissions (should be "Allow")
- Use a device with GPS (phones/tablets are more accurate than desktops)

### Issue 2: Permission Denied
**Solution:**
- Click the lock icon in browser address bar
- Set Location permission to "Allow"
- Refresh the page

### Issue 3: Timeout Error
**Solution:**
- Increased timeout to 15 seconds
- Try again in a location with better GPS signal
- Check if Location Services are enabled on your device

### Issue 4: Desktop Shows Wrong Location
**Note:** Desktop browsers often use WiFi/IP-based location which can be:
- 100m to several kilometers off
- Based on your ISP's location
- Less accurate than mobile GPS

**Test on mobile device for accurate GPS location**

## Verify Location Accuracy

Check the console log for `accuracy` value:
- **< 50m**: Good GPS signal
- **50-100m**: Moderate accuracy
- **> 100m**: Poor accuracy (WiFi/IP-based)

The accuracy is now displayed in the UI: `(±XXm)`

## Browser Compatibility

Geolocation API is supported in:
- ✅ Chrome/Edge (all platforms)
- ✅ Firefox (all platforms)
- ✅ Safari (all platforms)
- ✅ Mobile browsers

**HTTPS Required:** Geolocation only works on:
- `https://` sites
- `localhost` (for development)
