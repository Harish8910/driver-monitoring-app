export function stopVoiceAlerts() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return
  }

  window.speechSynthesis.cancel()
}

export function speakNavigationAlert(message: string) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(message)
  utterance.rate = 1
  utterance.pitch = 1
  utterance.volume = 1

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
