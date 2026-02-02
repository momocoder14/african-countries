#!/usr/bin/env node
import { 
  getCountryByCode, 
  getCountryByName, 
  getCountryNames, 
  searchCountries, 
  getCountriesByRegion, 
  getCountriesByTradeBloc,
  isLocationInCountry,
  africaGeoJSON,
  getAfricaGeoJSON,
  generateSVGMap,
  generateCountrySVGMap,
  toTerminalASCII
} from './index';

const args = process.argv.slice(2);
const command = args[0];
const param = args.slice(1).join(' ');

function printHelp() {
  console.log(`
African Countries CLI
Usage: african-countries <command> [argument]

Commands:
  list                 List all country names
  get <name|code>      Get details for a specific country
  search <query>       Search for countries by name, code, or capital
  region <region>      List countries in a specific region
  bloc <bloc>          List countries in a trade bloc
  within <lat> <lng>   Find which country a coordinate belongs to
  render               Preview the African map in terminal
  render-country <name> Render a specific country's SVG
  quiz                 Start a fun African geography quiz
  export-svg           Output SVG map of Africa to stdout
  export               Output the full GeoJSON to stdout
  help                 Show this help message
  `);
}

async function startQuiz() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string) => new Promise((resolve) => readline.question(query, resolve));
  const countries = [...getAfricaGeoJSON().features].sort(() => Math.random() - 0.5).slice(0, 5);
  
  console.log("\n🌍 Welcome to the African Geography Quiz! (5 Questions)");
  console.log("----------------------------------------------------\n");

  let score = 0;
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const type = Math.random() > 0.5 ? 'capital' : 'name';
    let answer;
    
    if (type === 'capital') {
      answer = await question(`${i + 1}. What is the capital of ${country.properties.name}? `);
      if ((answer as string).toLowerCase() === country.properties.capital.toLowerCase()) {
        console.log("✅ Correct!\n");
        score++;
      } else {
        console.log(`❌ Wrong! The capital is ${country.properties.capital}\n`);
      }
    } else {
      answer = await question(`${i + 1}. Which country has the flag ${country.properties.flag}? `);
      if ((answer as string).toLowerCase() === country.properties.name.toLowerCase()) {
        console.log("✅ Correct!\n");
        score++;
      } else {
        console.log(`❌ Wrong! That is the flag of ${country.properties.name}\n`);
      }
    }
  }

  console.log(`Final Score: ${score}/5`);
  if (score === 5) console.log("🏆 Excellence! You are an Africa Expert!");
  readline.close();
}

switch (command) {
  case 'list':
    console.log(getCountryNames().join('\n'));
    break;

  case 'get':
    if (!param) {
      console.error('Please provide a country name or code.');
      process.exit(1);
    }
    const country = getCountryByName(param) || getCountryByCode(param);
    if (country) {
      console.log(JSON.stringify(country.properties, null, 2));
    } else {
      console.error(`Country not found: ${param}`);
      process.exit(1);
    }
    break;

  case 'search':
    if (!param) {
      console.error('Please provide a search query.');
      process.exit(1);
    }
    const results = searchCountries(param);
    if (results.length > 0) {
      results.forEach(c => {
        console.log(`${c.properties.flag} ${c.properties.name} (${c.properties.alpha3}) - Capital: ${c.properties.capital}`);
      });
    } else {
      console.log('No results found.');
    }
    break;

  case 'region':
    if (!param) {
      console.error('Please provide a region name.');
      process.exit(1);
    }
    const regionResults = getCountriesByRegion(param as any);
    if (regionResults.length > 0) {
      regionResults.forEach(c => {
        console.log(`${c.properties.flag} ${c.properties.name}`);
      });
    } else {
      console.log('No countries found in this region.');
    }
    break;

  case 'bloc':
    if (!param) {
      console.error('Please provide a trade bloc name.');
      process.exit(1);
    }
    const blocResults = getCountriesByTradeBloc(param);
    if (blocResults.length > 0) {
      blocResults.forEach(c => {
        console.log(`${c.properties.flag} ${c.properties.name}`);
      });
    } else {
      console.log('No countries found in this trade bloc.');
    }
    break;

  case 'within':
    const [latStr, lngStr] = args.slice(1);
    if (!latStr || !lngStr) {
      console.error('Usage: african-countries within <lat> <lng>');
      process.exit(1);
    }
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const foundCountry = africaGeoJSON.features.find(f => isLocationInCountry(lat, lng, f.properties.name));
    if (foundCountry) {
      console.log(`Location is in: ${foundCountry.properties.flag} ${foundCountry.properties.name}`);
    } else {
      console.log('Location is not within any African country in the dataset.');
    }
    break;

  case 'render':
    console.log(toTerminalASCII(africaGeoJSON));
    break;

  case 'render-country':
    if (!param) {
      console.error('Please provide a country name or code.');
      process.exit(1);
    }
    const target = getCountryByName(param) || getCountryByCode(param);
    if (target) {
      console.log(generateCountrySVGMap(target as any, { width: 500, height: 500 }));
    } else {
      console.error(`Country not found: ${param}`);
      process.exit(1);
    }
    break;

  case 'quiz':
    startQuiz();
    break;

  case 'export-svg':
    console.log(generateSVGMap(africaGeoJSON, { width: 800, height: 800 }));
    break;

  case 'export':
    console.log(JSON.stringify(africaGeoJSON, null, 2));
    break;

  case 'help':
    printHelp();
    break;

  case undefined:
    printHelp();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
