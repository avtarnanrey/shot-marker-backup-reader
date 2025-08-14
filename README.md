# Shot Marker Backup Reader

A comprehensive toolkit for reading and analyzing Shot Marker shooting sports system backup files.

## Overview

This project provides JavaScript tools to extract, decode, and analyze shooting data from Shot Marker `.tar` backup files. The system can process compressed frame data, decode individual shots with positions and velocities, and provide detailed analysis of shooting sessions.

## Files Description

### Core Files

- **`extract_backup.js`** - Script to cleanly extract backup into organized folder structure
- **`utils_shotpack.js`** - Shot Marker utility functions for encoding/decoding shot data  
- **`backup_reader.js`** - Main processing script that orchestrates data reading and shot decoding
- **`test_shot_decode.js`** - Test script for validating shot data decoding and round-trip encoding
- **`extract_json.js`** - JSON extractor that converts matches to structured format for analysis
- **`explore_strings.js`** - Analysis tool for examining compressed historical data files

### Data Files (in SM_backup_Aug_13/ folder)

- **`SM_backup_Aug_13.tar`** - Original backup archive
- **`data.txt`** - Main data file containing current target frame states
- **`archive.txt`** - Historical archive data
- **`string-1xxxxxxxxxx.z`** - 632+ compressed string files containing historical shooting session data

## Installation & Setup

1. **Extract the backup archive into organized folder:**
```bash
# Default extraction (looks for SM_backup_Aug_13.tar)
node extract_backup.js

# Extract specific backup file
node extract_backup.js SM_backup_May_16_Vic_Final.tar

# Extract to custom directory
node extract_backup.js my_backup.tar custom_folder

# Show help
node extract_backup.js --help
```

2. **Install Node.js dependencies:**
```bash
npm install
```

The scripts automatically detect extracted folders, supporting multiple backup files.

## Usage

### 1. Extract Backup Files

```bash
# Default extraction (looks for SM_backup_Aug_13.tar)
node extract_backup.js

# Extract specific backup file
node extract_backup.js SM_backup_May_16_Vic_Final.tar

# Extract to custom directory
node extract_backup.js my_backup.tar custom_folder

# Show help
node extract_backup.js --help
```

### 2. Process Backup Data

```bash
# Process most recent backup automatically
node backup_reader.js

# Process specific backup folder
node backup_reader.js SM_backup_Aug_13
node backup_reader.js SM_backup_May_16_Vic_Final

# Show help
node backup_reader.js --help
```

### 3. Test Shot Decoding

```bash
# Test shot decoding with most recent backup
node test_shot_decode.js

# Test with specific folder (inherits from backup_reader.js)
node test_shot_decode.js SM_backup_Aug_13
```

### 4. Extract JSON Match Data

```bash
# Extract all matches to JSON (most recent backup)
node extract_json.js

# Extract from specific backup
node extract_json.js SM_backup_May_16_Vic_Final

# Custom output file
node extract_json.js SM_backup_Aug_13 my_matches.json

# Show help
node extract_json.js --help
```

**JSON Output Format:**
```json
[
  {
    "match": "M2",
    "shots": "V,5,4,5,4,5,4,5",
    "total": "50-5",
    "user": "Avtar Nanrey",
    "timestamp": "2024-05-11T14:18:12.112Z",
    "distance": "300 m",
    "target_face": "IF300m",
    "shot_data": [
      {
        "x": -21.8,
        "y": 23.0,
        "score": "V",
        "sighter": false,
        "display_text": "R1",
        "timestamp": "2024-05-11T13:53:55.829Z",
        "velocity": 643.4,
        "temperature": 19.25,
        "target_face": "IF300m"
      }
    ]
  }
]
```

**Output:**
- Processes all target frames
- Shows frames with shot data
- Decodes shot positions, velocities, and timestamps
- Displays temperature readings

### 2. Test Shot Decoding

Validates the encoding/decoding system with real data:

```bash
node test_shot_decode.js
```

**Output:**
- Tests shot decoding from sample frames
- Performs round-trip encoding validation
- Shows detailed shot information (position, velocity, temperature)

### 3. Explore All Historical Data

Analyzes all 632+ compressed historical data files:

```bash
node explore_strings.js
```

**Output:**
- Summary of all shooting sessions by date
- Shot counts per session
- Target frame information
- File type analysis

### 4. Examine Specific Sessions

Examine individual shooting sessions in detail:

```bash
node explore_strings.js <timestamp>
```

**Example:**
```bash
node explore_strings.js 1715436178223
```

**Output:**
- Detailed session information
- Individual shot decoding
- Target specifications
- Scoring data

## Data Structure

### Shot Data Format

Each shot contains:
- **Position**: X, Y coordinates on target
- **Velocity**: Shot velocity in fps
- **Timestamp**: When the shot was recorded
- **Temperature**: Environmental temperature
- **Error Codes**: Any system warnings or errors

### Target Frame Data

Each target frame includes:
- **Frame ID**: Unique identifier
- **Label**: Target designation (e.g., "T-22", "M1")
- **Dimensions**: Target width x height
- **Distance**: Shooting distance and units
- **Active State**: Current frame status
- **Shot Arrays**: Valid and invalid shots

### Historical Data

The backup contains shooting data from:
- **May 11-20, 2024** - Extensive shooting sessions
- **June 22, 29-30, 2024** - Additional sessions
- **July 1, 2024** - More data
- **August 3-4, 2024** - Recent sessions
- **September 14-15, 2024** - Latest recorded sessions

## Technical Details

### Compression

- Historical data files use zlib compression
- Compression ratios typically 40-60%
- Files are named by Unix timestamp

### Encoding System

- Custom base64-like encoding for shot data
- Mathematical helper functions for data processing
- Round-trip encoding validation ensures data integrity

### Shot Decoding Process

1. **Extract** compressed data from string files
2. **Parse** JSON structure
3. **Decode** individual shot strings using custom algorithm
4. **Convert** to readable position, velocity, and timing data

## Examples

### Reading Current Target Data
```javascript
const { main } = require('./backup_reader.js');
main(); // Processes all current frames
```

### Analyzing Historical Session
```javascript
const { examine_string_file } = require('./explore_strings.js');
examine_string_file('1715436178223'); // Examines specific session
```

### Testing Shot Decoding
```javascript
const { test_shot_decoding } = require('./test_shot_decode.js');
test_shot_decoding(); // Validates encoding/decoding
```

## Troubleshooting

### Common Issues

1. **"str.substring is not a function"** - Shot data may be in different format, check shot string type
2. **Compression errors** - Ensure zlib is properly handling the data format
3. **Parse errors** - Some files may have malformed JSON, error handling is included

### Data Validation

- Use `test_shot_decode.js` to validate the system is working correctly
- Round-trip encoding tests ensure data integrity
- Error messages indicate specific issues with shot decoding

## Output Examples

### Session Analysis
```
=== Examining String File 1715436178223 ===
Timestamp: Sat May 11 2024 10:02:58 GMT-0400 (Eastern Daylight Time)
Frame ID: 201
Label: M4
Target: 1727x1727 at 300 m
Shots (5): Individual shot positions and velocities
```

### Shot Decoding
```
Shot 1: (123.45, 67.89) at 2850.3 fps
Shot 2: (234.56, 78.90) at 2847.1 fps
```

## API Reference

### backup_reader.js
- `main()` - Process all target frames
- `decode_frame_shots(frame)` - Decode shots for specific frame
- `storage_read_string(id)` - Read compressed string data

### explore_strings.js
- `explore_string_files()` - Analyze all historical files
- `examine_string_file(id)` - Examine specific session
- `analyze_string_file(id)` - Get session metadata

### test_shot_decode.js
- `test_shot_decoding()` - Run validation tests
- Round-trip encoding verification

## Performance

- Processing 632 files takes approximately 5-10 seconds
- Individual file examination is instantaneous
- Memory usage scales with number of shots per session

## License

This toolkit is for analyzing Shot Marker backup data. Ensure you have appropriate permissions to access and analyze the shooting data.
