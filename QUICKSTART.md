# Shot Marker Backup Reader - Quick Reference

## Quick Start Commands

```bash
# Check project status and organization
node project_status.js

# Extract backup into organized folder
node extract_backup.js                               # Default file
node extract_backup.js SM_backup_May_16_Vic_Final.tar # Specific file
node extract_backup.js my_backup.tar custom_folder   # Custom output

# Install dependencies (if needed)
npm install

# Read current data
node backup_reader.js

# Test decoding
node test_shot_decode.js

# Explore all historical data
node explore_strings.js

# Examine specific session
node explore_strings.js 1715436178223
```

## Folder Structure

After extraction, your data will be organized as:
```
d:\Projects\Shot Marker\
├── extract_backup.js          # Extraction script
├── backup_reader.js           # Main reader
├── explore_strings.js         # Data explorer
├── test_shot_decode.js        # Testing script
├── utils_shotpack.js          # Utilities (copied from backup)
├── read_backup.js             # Utilities (copied from backup)
├── SM_backup_Aug_13.tar       # Original backup
└── SM_backup_Aug_13/          # ← Extracted data folder
    ├── data.txt               # Current frame data
    ├── archive.txt            # Historical data
    ├── utils_shotpack.js      # Original utilities
    ├── read_backup.js         # Original utilities
    └── string-*.z files       # 632+ compressed session files
```

## Understanding the Output

### Shot Data Format
```
Shot 1: (28.80, 31.10) at 710.6 fps, temp: 19.3°C
```
- **(X, Y)**: Position coordinates on target
- **fps**: Shot velocity in feet per second
- **temp**: Environmental temperature in Celsius

### Target Information
```
Frame ID: 201
Label: M4
Target: 1727x1727 at 300 m
```
- **Frame ID**: Unique target identifier
- **Label**: Target designation (M1-M7, T-20 to T-31)
- **Target size**: Width x Height in pixels
- **Distance**: Shooting distance with units

### Session Data
```
1715436178223 (5/11/2024): Frame 201 "M4" - 5 shots
```
- **Timestamp**: File ID (Unix timestamp)
- **Date**: Human-readable date
- **Frame**: Target frame number
- **Label**: Target name
- **Shot count**: Number of shots in session

## Common Target Types

- **M1-M7**: Match targets
- **T-20 to T-31**: Training targets
- **Distance units**: meters (m) or yards (y)
- **Common distances**: 300m, 1000y

## File Analysis Results

Your backup contains:
- **632 total files** (631 with shot data)
- **Date range**: May 2024 - September 2024
- **Shot counts**: 1-136 shots per session
- **Multiple target configurations** and distances

## Troubleshooting

### If you see decode errors:
- The fix handles different shot data formats automatically
- Shows raw data if format is unrecognized
- Includes error details for debugging

### Common file patterns:
- Files starting with `171`: May 2024 data
- Files starting with `172`: July-September 2024 data
- Large shot counts (50+): Extended practice sessions
- Single shots: Test or calibration data

## Data Export Options

To export specific session data, you can modify the scripts to:
1. Save shot coordinates to CSV
2. Generate target plots
3. Calculate accuracy statistics
4. Filter by date ranges or target types

Example for CSV export (add to examine_string_file function):
```javascript
// Generate CSV output
const csvData = data.shots.map((shot, i) => 
    `${i+1},${shot.x},${shot.y},${shot.v},${shot.temp || 'N/A'}`
).join('\n');
console.log('Shot,X,Y,Velocity,Temperature');
console.log(csvData);
```
