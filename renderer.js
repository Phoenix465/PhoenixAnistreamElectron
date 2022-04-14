const animeWidgetTemp = document.querySelector("#AnimeWidgetMainTemplate");
const searchAnimeWidgetTemp = document.querySelector("#SearchAnimeWidgetMainTemplate");
const RecentAddedGridElement = document.querySelector(".RecentAddedGrid");
const SearchGridElement = document.querySelector(".SearchGrid");
const LoadingElement = document.querySelector("#loading");

function ExecuteAsync(func) {
    setTimeout(func, 0);
}

const GetAnimeIcon = async(altName, url) => {
    const iconPath = await window.electronAPI.GetAnimeIcon(url);

    const animeImage = document.querySelectorAll(`#AnimeWidget-${altName} img`)[0]

    if (animeImage) {
        animeImage.src = iconPath;
        // console.log(animeImage)
    }
}

const GetSearchAnimeIcon = async(altName, url) => {
    const iconPath = await window.electronAPI.GetAnimeIcon(url);

    const animeImage = document.querySelectorAll(`#SearchAnimeWidget-${altName} img`)[0]

    if (animeImage) {
        animeImage.src = iconPath;
        // console.log(animeImage)
    }
}


const UpdateGridRecentlyAdded = async() => {
    let s = new Date().getTime();
    const LatestDataArray = await window.electronAPI.GetLatestData();

    let e1 = new Date().getTime() - s;
    console.log(`Initial Scraping ${e1}`)

    RecentAddedGridElement.innerHTML = "";

    for (var i = 0; i < LatestDataArray.length; i++) {
        let animeData = LatestDataArray[i]

        var animeWidgetStringClone = animeWidgetTemp.innerHTML;

        for ([key, value] of Object.entries(animeData)) {
            if (key === "thumbnail") {
                animeWidgetStringClone = animeWidgetStringClone.replaceAll(key, "./resources/loading.gif");
                animeWidgetStringClone = animeWidgetStringClone.replaceAll("thumbnail-source", value);
                ExecuteAsync(GetAnimeIcon.bind(null, animeData["alt-name"], animeData["thumbnail"]));

                continue;
            }

            animeWidgetStringClone = animeWidgetStringClone.replaceAll(key, value);
        }

        RecentAddedGridElement.insertAdjacentHTML("beforeend", animeWidgetStringClone)
    }

    let e = new Date().getTime() - s;
    console.log(`Initial Loading ${e}`)
}


UpdateGridRecentlyAdded();

const SearchButton = document.querySelector("#SearchButton");
const BackButton = document.querySelector("#BackButton");
const titleElement = document.querySelector(".title");
const SearchLineRectangle = document.querySelector(".SearchLineRectangle");
const SearchInput = document.querySelector("#SearchInput");

const RecentlyAddedGrid = document.querySelector("#RecentAddedGrid");
const SearchGrid = document.querySelector("#SearchGrid");

let searchQueue = [];
let searchThreadAlive = false;

let s = 0;
let seachQueryString = "";
let searchTimes = []

function SearchButtonClicked() {
    SearchButton.classList.add("ToggleSearchAnimationOn");
    titleElement.classList.add("ToggleSearchTitleAnimationOn");
    SearchLineRectangle.classList.add("ToggleSearchLineRectangleAnimationOn");
    BackButton.classList.add("ToggleSearchBackButtonAnimationOn");
}

function BackButtonClicked() {
    SearchButton.classList.remove("ToggleSearchAnimationOn");
    titleElement.classList.remove("ToggleSearchTitleAnimationOn");
    SearchLineRectangle.classList.remove("ToggleSearchLineRectangleAnimationOn");
    BackButton.classList.remove("ToggleSearchBackButtonAnimationOn");

    SearchInput.value = "";
    SearchInputChanged();
}

function RunSearchQueue() {
    if (searchQueue.length > 0) {
        searchThreadAlive = true;
        const searchQuery = searchQueue.pop();

        s = new Date().getTime();
        seachQueryString = searchQuery;

        // console.log(`Searching ${searchQuery}`)

        setTimeout(function () {
            window.electronAPI.SearchAnime(searchQuery);
        });
    }
}

window.electronAPI.SearchAnimeReceiver(function(searchData) {
    // console.log(searchData);
    let e = new Date().getTime() - s;
    searchTimes.push(e)
    const sum = searchTimes.reduce((a, b) => a + b, 0);
    const avg = (sum / searchTimes.length) || 0;

    console.log(`Search Time for ${seachQueryString} is ${e}, ${Math.round(avg)}`)

    SearchGridElement.innerHTML = "";

    searchThreadAlive = false;
    if (searchQueue.length > 0) {
        RunSearchQueue();
        return;
    }

    LoadingElement.classList.add("hidden");

    for (var i = 0; i < searchData.length; i++) {
        let animeData = searchData[i]

        var animeWidgetStringClone = searchAnimeWidgetTemp.innerHTML;

        for ([key, value] of Object.entries(animeData)) {
            if (key === "thumbnail") {
                animeWidgetStringClone = animeWidgetStringClone.replaceAll(key, "./resources/loading.gif");
                animeWidgetStringClone = animeWidgetStringClone.replaceAll("thumbnail-source", value);
                ExecuteAsync(GetSearchAnimeIcon.bind(null, animeData["alt-name"], animeData["thumbnail"]));

                continue;
            }

            animeWidgetStringClone = animeWidgetStringClone.replaceAll(key, value);
        }

        SearchGridElement.insertAdjacentHTML("beforeend", animeWidgetStringClone)
    }
})

function SearchInputChanged(inputEvent) {
    const text = SearchInput.value;

    if (text.length > 2) {
        SearchGridElement.innerHTML = "";
        SearchGrid.classList.remove("hidden")
        RecentlyAddedGrid.classList.add("hidden")
        LoadingElement.classList.remove("hidden");

        searchQueue = [];
        searchQueue.push(text);

        if (searchQueue.length === 1 && !searchThreadAlive) {
            RunSearchQueue();
        } else {
            window.electronAPI.SearchAnimeCancel();
        }
    }
    else {
        LoadingElement.classList.add("hidden");
        RecentlyAddedGrid.classList.remove("hidden");
        SearchGrid.classList.add("hidden");
        SearchGridElement.innerHTML = "";
    }
}

SearchButton.addEventListener("click", SearchButtonClicked);
BackButton.addEventListener("click", BackButtonClicked);
SearchInput.addEventListener("input", SearchInputChanged)