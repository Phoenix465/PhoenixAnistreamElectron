const axios = require('axios');
const fs = require("fs");
const path = require("path");


module.exports = {
    GetLatestData: GetLatestData,
    GetAnimeIcon: GetAnimeIcon,
    SearchAnime: SearchAnime,
    SearchAnimeCancel: SearchAnimeCancel,
}

const headers = {
    "User-Agent": 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
}

var searchCounter = 0;


async function get(url) {
    const config = {
        method: 'get',
        url: url,
        headers: headers
    };

    return axios(config);
}

async function download (url, dPath) {
    const writer = fs.createWriteStream(dPath)

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

async function GetLatestData() {
    const url = "https://www1.gogoanime.cm";
    var recentlyAddedRegex = new RegExp(
        `<div class=\"img\">
        \\s*<a href=\"(?:.*?)\" title=\"(.*?)\">
        \\s*<img src=\"(.*?)\" alt=\"(?:.*?)\" \/>
        \\s*<div class=\"type ic-SUB\"><\/div>
        \\s*<\/a>
        \\s*<\/div>
        \\s*<p class=\"name\"><a href=\"(?:.*?)\" title=\"(?:.*?)\">(?:.*?)<\/a><\/p>
        \\s*<p class=\"episode\">Episode (.*?)<\/p>`,

        'gm'
    )

    const urlRequest = await get(url);
    let recentlyAddedAnimeData = [];

    if (urlRequest.status === 200) {
        const content = urlRequest.data

        // var hrTime = process.hrtime();
        // let s = hrTime[0] * 1000000 + hrTime[1] / 1000;

        let m;

        while ((m = recentlyAddedRegex.exec(content)) !== null) {
            if (m.index === recentlyAddedRegex.lastIndex) {
                recentlyAddedRegex.lastIndex++;
            }

            let animeData = {};
            const groupNames = ["anime-name", "thumbnail", "episode", "anime-link", "alt-name"];
            m.forEach((match, groupIndex) => {
                if (groupIndex === 0) {
                    return;
                }
                animeData[groupNames[groupIndex - 1]] = match;
            });

            let animeAltName = animeData[groupNames[1]].split("/").at(-1).split(".")[0];
            animeData[groupNames[3]] = `https://www1.gogoanime.cm/category/${animeAltName}`;
            animeData[groupNames[4]] = `${animeAltName}`;

            recentlyAddedAnimeData.push(animeData);
        }

        // var hrTime = process.hrtime();
        // let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
        // console.log(`Time Taken ${e/1000}ms`)
    }

    return recentlyAddedAnimeData;
}

async function GetAnimeIcon(url) {
    const dPath = path.resolve(__dirname, 'cache', url.split("/").at(-1))
    // console.log(dPath);

    if (!fs.existsSync(dPath)) {
        await download(url, dPath);
    }

    return dPath;
}

function SearchAnimeCancel() {
    searchCounter++;
}

async function SearchUrlSingle(searchUrl, checkPage=false, currentRetry=0) {
    const searchAnimeRegex = new RegExp(
        `<div class=\"img\">
        \\s*<a href=\"(?:.*?)" title=\"(?:.*?)">
        \\s*<img src="(.*?)" alt=\"(?:.*?)\" \/>
        \\s*<\/a>
        \\s*<\/div>
        \\s*<p class=\"name\"><a href=\"(.*?)\" title=\"(?:.*?)\">(.*?)<\/a><\/p>
        \\s*<p class=\"(?:.*?)\">
        \\s*(.*?\\s)\\s`,

        'gm'
    )

    const pageNumberMaxRegex = new RegExp(
        `<div class=\"pagination\">
        \\s*<ul class=\'pagination-list\' >(<li (?:.*?)><a href=\'(?:.*?)\' data-page=\'(?:.*?)\'>(.*?)<\\/a><\\/li>){1,}(?:.*?)<\\/ul>`,

        'gm'
    )

    const urlRequest = await get(searchUrl);
    let searchAnimeData = [];
    let maxPageNumber = 1;

    if (urlRequest.status === 200) {
        const content = urlRequest.data

        // var hrTime = process.hrtime();
        // let s = hrTime[0] * 1000000 + hrTime[1] / 1000;

        let m;

        if (checkPage) {
            while ((m = pageNumberMaxRegex.exec(content)) !== null) {
                if (m.index === pageNumberMaxRegex.lastIndex) {
                    pageNumberMaxRegex.lastIndex++;
                }

                m.forEach((match, groupIndex) => {
                    if (groupIndex === 2) {
                        maxPageNumber = Number(match);
                    }
                });
            }
        }

        m = null;

        while ((m = searchAnimeRegex.exec(content)) !== null) {
            if (m.index === searchAnimeRegex.lastIndex) {
                searchAnimeRegex.lastIndex++;
            }

            let animeData = {};
            const groupNames = ["thumbnail", "anime-link", "anime-name", "release-date", "alt-name"];

            m.forEach((match, groupIndex) => {
                if (groupIndex === 0) {
                    return;
                }

                animeData[groupNames[groupIndex - 1]] = match;
            });

            let animeAltName = animeData[groupNames[1]].split("/").at(-1).split(".")[0];
            animeData[groupNames[1]] = `https://www1.gogoanime.cm/${animeData[groupNames[1]]}`;
            animeData[groupNames[4]] = `${animeAltName}`;

            searchAnimeData.push(animeData);
        }
    }

    else {
        console.log(`Failed to Request for ${queryUrl}`)

        if (currentRetry >= 3) {
            console.log("Retried Exceeded")
            return [[], 1];
        } else {
            return await SearchUrlSingle(searchUrl, checkPage, currentRetry++);
        }
    }

    return [searchAnimeData, maxPageNumber]
}

async function SearchAnime(query, event) {
    const searchUrlBase = "https://www1.gogoanime.cm//search.html?keyword="
    const searchIndex = searchCounter;
    searchCounter++;

    let queryUrl = `${searchUrlBase}${encodeURIComponent(query)}`

    var hrTime = process.hrtime();
    let s = hrTime[0] * 1000000 + hrTime[1] / 1000;

    let [searchAnimeData, maxPageNumber] = await SearchUrlSingle(queryUrl, true);
    let threadCounter = 0;
    let searchFinishedEarly = false;
    // console.log(`Max Page Number ${maxPageNumber}`);

    if (searchIndex + 1 !== searchCounter) {
        var hrTime = process.hrtime();
        let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
        // console.log(`Time Taken Search ${e/1000}ms - Exited Early`)

        event.sender.send("SearchAnimeReceiver", [])
        return;
    }

    if (maxPageNumber > 1) {
        for (let i = 2; i <= maxPageNumber; i++) {
            setTimeout(async function(pageI) {
                threadCounter++;

                let tempQueryUrl = `${queryUrl}&page=${pageI}`
                if (searchIndex + 1 !== searchCounter) {
                    if (!searchFinishedEarly) {
                        var hrTime = process.hrtime();
                        let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
                        // console.log(`Time Taken Search ${e/1000}ms - Exited Early`)

                        event.sender.send("SearchAnimeReceiver", [])
                    }

                    searchFinishedEarly = true;

                    return;
                }

                let [tempSearchData, tempPageNumber] = await SearchUrlSingle(tempQueryUrl, false);

                searchAnimeData = searchAnimeData.concat(tempSearchData);

                threadCounter--;

                if (searchIndex + 1 !== searchCounter || searchFinishedEarly) {
                    if (!searchFinishedEarly) {
                        var hrTime = process.hrtime();
                        let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
                        // console.log(`Time Taken Search ${e/1000}ms - Exited Early`)

                        event.sender.send("SearchAnimeReceiver", [])
                    }

                    searchFinishedEarly = true;

                    return;
                }

                // console.log(`Thread Counter ${threadCounter}`)
                if (threadCounter === 0 && !searchFinishedEarly) {
                    var hrTime = process.hrtime();
                    let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
                    // console.log(`Time Taken Search ${e/1000}ms`)

                    event.sender.send("SearchAnimeReceiver", searchAnimeData)
                }

            }.bind(null, i));
        }
    } else {
        var hrTime = process.hrtime();
        let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
        // console.log(`Time Taken Search ${e/1000}ms`)

        event.sender.send("SearchAnimeReceiver", searchAnimeData)
    }
}

async function SearchAnimeExtraData(animeUrl) {

}