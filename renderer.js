const UpdateGridRecentlyAdded = async() => {
    const test = await window.electronAPI.GetLatestData();
    console.log(test);
}
UpdateGridRecentlyAdded();
