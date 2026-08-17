export function calculateSolarSystem(userQuery) {
  // Extract numbers and units
  const unitsMatch = userQuery.match(/(\d+)\s*(?:units|kWh|electricity)/i);
  const billMatch = userQuery.match(/(?:bill|eb|rs|₹)\s*:?\s*(\d+)/i);
  const areaMatch = userQuery.match(/(\d+)\s*(?:sqft|square feet|area)/i);
  
  let units = unitsMatch ? parseInt(unitsMatch[1]) : null;
  let monthlyBill = billMatch ? parseInt(billMatch[1]) : null;
  
  // Convert bill to units if needed
  if (monthlyBill && !units) {
    units = Math.round(monthlyBill / 7); // Approx ₹7 per unit
  }
  
  if (!units && !monthlyBill) return null;
  
  // Calculate system size (kW)
  // Formula: Required kW = Monthly Units / 120 (average 4 hours of good sunlight)
  let systemKW = units ? units / 120 : monthlyBill / 7 / 120;
  systemKW = Math.ceil(systemKW * 2) / 2; // Round to nearest 0.5kW
  
  // Ensure minimum 1kW
  if (systemKW < 1) systemKW = 1;
  if (systemKW > 25) systemKW = 25;
  
  // Calculate costs
  const costPerKW = 65000; // Average ₹65,000 per kW
  const totalCost = systemKW * costPerKW;
  
  // Subsidy calculation (PM Surya Ghar Scheme)
  let subsidy = 0;
  if (systemKW <= 3) {
    subsidy = Math.min(78000, systemKW * 26000);
  } else {
    subsidy = 78000 + (systemKW - 3) * 13000;
    subsidy = Math.min(subsidy, totalCost * 0.4); // Max 40% subsidy
  }
  
  const afterSubsidy = totalCost - subsidy;
  
  // Monthly savings
  const unitsGenerated = systemKW * 120; // 4 hours * 30 days = 120 units per kW
  const monthlySavings = unitsGenerated * 7; // ₹7 per unit
  
  // Space required (100 sqft per kW)
  const spaceRequired = systemKW * 100;
  
  // Battery recommendation
  let batteryRecommendation = null;
  if (systemKW <= 3) {
    batteryRecommendation = { type: 'Tubular', capacity: `${systemKW * 1.5}kWh`, price: 25000 };
  } else {
    batteryRecommendation = { type: 'Lithium-ion', capacity: `${systemKW * 1.2}kWh`, price: systemKW * 15000 };
  }
  
  return {
    systemKW,
    estimatedUnitsPerMonth: Math.round(unitsGenerated),
    totalCost: totalCost,
    subsidyAmount: Math.round(subsidy),
    finalCost: Math.round(afterSubsidy),
    monthlySavings: Math.round(monthlySavings),
    paybackYears: (afterSubsidy / monthlySavings / 12).toFixed(1),
    spaceRequired: spaceRequired,
    batteryRecommendation: batteryRecommendation,
    inverterRecommendation: systemKW <= 5 ? 'Luminous 5kW Hybrid' : 'Growatt 10kW On-Grid',
    panelsRequired: Math.ceil(systemKW * 3.5) // Approx 3-4 panels per kW
  };
}