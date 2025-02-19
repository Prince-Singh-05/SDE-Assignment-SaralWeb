const fs = require("fs");
const readline = require("readline");

async function parseLogFile(filePath) {
	const ipCount = {};
	const hourlyTraffic = {};
	const logPattern =
		/(?<ip>\d+\.\d+\.\d+\.\d+) - - \[(?<timestamp>\d+\/\w+\/\d{4}:(?<hour>\d{2}):\d{2}:\d{2})/;

	const fileStream = fs.createReadStream(filePath);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	for await (const line of rl) {
		const match = logPattern.exec(line);
		if (match) {
			const ip = match.groups.ip;
			const hour = match.groups.hour;

			ipCount[ip] = (ipCount[ip] || 0) + 1;
			hourlyTraffic[hour] = (hourlyTraffic[hour] || 0) + 1;
		}
	}

	return { ipCount, hourlyTraffic };
}

function getTopContributors(data, percentage) {
	const total = Object.values(data).reduce((sum, count) => sum + count, 0);
	const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);

	let cumulative = 0;
	const topContributors = [];

	for (const [key, count] of sortedEntries) {
		cumulative += count;
		topContributors.push(key);
		if ((cumulative / total) * 100 >= percentage) break;
	}

	return topContributors;
}

function printHistogramIP(ipCount) {
	console.log(" IP Address            Occurrences");
	console.log("-----------------------------------");
	Object.entries(ipCount)
		.sort((a, b) => b[1] - a[1])
		.forEach(([ip, count]) => {
			console.log(` ${ip.padEnd(20)} | ${count}`);
		});
}

function printHistogramHourly(hourlyTraffic) {
	console.log("\n Hour  | Visitors");
	console.log("--------------------");
	Object.keys(hourlyTraffic)
		.sort()
		.forEach((hour) => {
			console.log(` ${hour.padEnd(5)} | ${hourlyTraffic[hour]}`);
		});
}

(async function () {
	const logFilePath = "server.log";
	const { ipCount, hourlyTraffic } = await parseLogFile(logFilePath);
	printHistogramIP(ipCount);
	printHistogramHourly(hourlyTraffic);

	console.log("\nIP addresses contributing to 85% of traffic:");
	console.log(getTopContributors(ipCount, 85));

	console.log("\nHours contributing to 70% of overall traffic:");
	console.log(getTopContributors(hourlyTraffic, 70));
})();
