const fs = require("fs");
const readline = require("readline");
const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(cors());

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
	console.log(Object.entries(data));
	console.log("sorted entries", sortedEntries);

	let cumulative = 0;
	const topContributors = [];

	for (const [key, count] of sortedEntries) {
		cumulative += count;
		topContributors.push(key);
		if ((cumulative / total) * 100 >= percentage) break;
	}

	return topContributors;
}

app.get("/data", async (req, res) => {
	const logFilePath = "server.log";
	const { ipCount, hourlyTraffic } = await parseLogFile(logFilePath);

	const topIPs = getTopContributors(ipCount, 85);
	const topHours = getTopContributors(hourlyTraffic, 70);

	res.json({
		Question_1: {
			ipCount: {
				message:
					"Distinct IP addresses that hit the server on a given day:",
				data: ipCount,
			},
			hourlyTraffic: {
				message: "Hourly traffic on a given day:",
				data: hourlyTraffic,
			},
		},
		Question_2: {
			topIPs: {
				message: "IP addresses contributing to 85% of traffic:",
				data: topIPs,
			},
			topHours: {
				message: "Hours contributing to 70% of overall traffic:",
				data: topHours,
			},
		},
	});
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
