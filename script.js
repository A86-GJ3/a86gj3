console.log("script.js")

const cubismToken = "Cubism Editor Web Plugin Token Parameter Control"
let storageToken = null
if (!location.href.startsWith("file://")) {
    storageToken = localStorage.getItem(cubismToken)
}

window.cePlugin = new CEPlugin("Cubism Editor Plugin API", storageToken);



const strClearData = "Empty"
const strStoredData = "Stored"
const parameterComp = "Cubism Editor Web Plugin Parameter Comp No"
const parameterCompMemo = "Cubism Editor Web Plugin Parameter Comp Memo No"
const parameterCompNumMax = 16
let loadFileData = null

window.onload = function() {
    for (let i = 1; i <= parameterCompNumMax; i++) {
        const localStorageData = localStorage.getItem(parameterComp + String(i))
        if (localStorageData != null) {
            document.getElementById("state_" + String(i)).textContent = strStoredData
        } else {
            document.getElementById("state_" + String(i)).textContent = strClearData
        }
        
        const memo = localStorage.getItem(parameterCompMemo + String(i))
        document.getElementById("memo_" + String(i)).value = memo
    }
}

cePlugin.onStateChanged = (state) => {
    switch (state) {
    case CEPlugin.DISCONNECTED:
        document.getElementById("state").textContent = "Disconnected"
        break
    case CEPlugin.CONNECTING:
        document.getElementById("state").textContent = "Connecting"
        break
    case CEPlugin.OPEN:
        document.getElementById("state").textContent = "Open"
        break
    case CEPlugin.CONNECTED:
        document.getElementById("state").textContent = "Connected"
        if (!location.href.startsWith("file://")) {
            localStorage.setItem(cubismToken, cePlugin.token)
        }
        document.getElementById("textarea_errorLog").value = ""
        break
    case CEPlugin.SOCKET_ERROR:
        document.getElementById("state").textContent = "Socket Error"
        document.getElementById("textarea_errorLog").value = cePlugin.errorMessage
        break
    case CEPlugin.API_ERROR:
        document.getElementById("state").textContent = "Api Error"
        document.getElementById("textarea_errorLog").value = cePlugin.errorMessage
        break
    }
}

function connect() {
    console.log("start connect: ", server.value)
    cePlugin.start(server.value)
}

function disconnect() {
    console.log("disconnect.")
    stop()
    cePlugin.stop()
}
