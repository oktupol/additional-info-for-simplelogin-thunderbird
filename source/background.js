messenger.messageDisplay.onMessageDisplayed.addListener(async (tab, message) => {
  let full = await messenger.messages.getFull(message.id);
  
  let isForwarded = full.headers.hasOwnProperty("x-simplelogin-type") && full.headers["x-simplelogin-type"][0] === "Forward";
  
  console.log("Forward? " + isForwarded)
  console.log(messenger.messageDisplayAction);
  
  if (isForwarded) {
    messenger.messageDisplayAction.enable();
  } else {
    messenger.messageDisplayAction.disable();
  }
});