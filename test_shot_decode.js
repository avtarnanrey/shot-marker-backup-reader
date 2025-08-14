const fs = require('fs');
const path = require('path');
const { decode_shot, encode_shot } = require('./backup_reader.js');

// Test shot decoding with the encoded shots found in the data
function test_shot_decoding() {
    console.log("=== Testing Shot Decoding ===\n");
    
    // Determine the data directory - check for multiple possible extraction folders
    function findDataDirectory() {
        const possibleDirs = [
            'SM_backup_Aug_13',  // Default
            fs.readdirSync('.').find(dir => 
                fs.statSync(dir).isDirectory() && 
                dir.startsWith('SM_backup_') && 
                fs.existsSync(path.join(dir, 'data.txt'))
            ),
            '.' // Fallback to current directory
        ].filter(Boolean);
        
        for (const dir of possibleDirs) {
            if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'data.txt'))) {
                return dir;
            }
        }
        
        return '.'; // Final fallback
    }
    
    const dataDir = findDataDirectory();
    console.log(`Using data directory: ${path.resolve(dataDir)}`);
    
    // Read the main data to find encoded shots
    const dataPath = path.join(dataDir, 'data.txt');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Find frames with shot data
    const framesWithShots = Object.entries(data.frames || {}).filter(([id, frame]) => 
        frame.shots && frame.shots.length > 0
    );
    
    console.log(`Found ${framesWithShots.length} frames with shot data\n`);
    
    framesWithShots.forEach(([frameId, frame]) => {
        console.log(`Frame ${frameId} (${frame.label}):`);
        console.log(`  Distance: ${frame.dist} ${frame.dist_unit}`);
        console.log(`  Target size: ${frame.width}x${frame.height}`);
        console.log(`  Number of shots: ${frame.shots.length}`);
        
        frame.shots.forEach((encodedShot, index) => {
            try {
                const shot = decode_shot(encodedShot);
                console.log(`  Shot ${index + 1}:`);
                console.log(`    Timestamp: ${new Date(shot.ts)}`);
                console.log(`    Position: (${shot.x?.toFixed(2)}, ${shot.y?.toFixed(2)})`);
                console.log(`    Velocity: ${shot.v?.toFixed(1)} fps`);
                console.log(`    Temperature: ${shot.temp}°C`);
                console.log(`    Multi-assign: ${shot.multi_assign || 0}`);
                
                if (shot.error) {
                    console.log(`    Error: ${shot.error}`);
                }
                if (shot.warning) {
                    console.log(`    Warning: ${shot.warning}`);
                }
                
                // Test round-trip encoding
                const reencoded = encode_shot(shot);
                const redecoded = decode_shot(reencoded);
                
                const positionMatch = Math.abs((shot.x || 0) - (redecoded.x || 0)) < 1 && 
                                   Math.abs((shot.y || 0) - (redecoded.y || 0)) < 1;
                
                console.log(`    Round-trip test: ${positionMatch ? 'PASS' : 'FAIL'}`);
                
            } catch (e) {
                console.log(`  Shot ${index + 1}: Decode error - ${e.message}`);
            }
        });
        console.log();
    });
}

if (require.main === module) {
    test_shot_decoding();
}
