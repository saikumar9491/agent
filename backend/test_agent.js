const { researchAgent } = require('./agent/index.js');
async function run() {
  try {
    const res = await researchAgent.invoke({
      companyName: "Apple Inc.",
      financials: null,
      news: [],
      decision: null,
      reasoning: ''
    });
    console.log("FINAL COMPANY IMAGE:", res.companyImage);
  } catch (e) {
    console.error(e);
  }
}
run();
