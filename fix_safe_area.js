const fs = require('fs');
const path = require('path');

const screensDir = '/Users/akshatkumar/Desktop/monefyai/src/screens';
const filesToUpdate = [
    'main/GoalPulseScreen.tsx',
    'onboarding/AddGoalScreen.tsx',
    'main/EditGoalScreen.tsx',
    'main/ContributionsScreen.tsx',
    'main/ProfileScreen.tsx',
    'main/EditFinancialDetailsScreen.tsx',
    'main/NotificationSettingsScreen.tsx',
    'main/HelpSupportScreen.tsx',
    'main/PrivacySecurityScreen.tsx',
    'main/PersonalInfoScreen.tsx'
];

filesToUpdate.forEach(file => {
    const filePath = path.join(screensDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove SafeAreaView, from react-native import
        content = content.replace(/^[ \t]*SafeAreaView,?\r?\n/m, '');
        
        // Add import { SafeAreaView } from 'react-native-safe-area-context'; after react-native import if not present
        if (!content.includes("from 'react-native-safe-area-context'")) {
            content = content.replace("from 'react-native';", "from 'react-native';\nimport { SafeAreaView } from 'react-native-safe-area-context';");
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
