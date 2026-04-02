const BEEP_SOUND_PATH = "/sounds/freesound_community-beep-beep-43875.mp3"

let activeBeepAudio: HTMLAudioElement | null = null

export function playAlertBeep() {
  if (typeof Audio === "undefined") {
    return
  }

  if (!activeBeepAudio) {
    activeBeepAudio = new Audio(BEEP_SOUND_PATH)
    activeBeepAudio.preload = "auto"
  }

  activeBeepAudio.currentTime = 0
  void activeBeepAudio.play().catch(() => {
    // Ignore autoplay restrictions until the user has interacted again.
  })
}

export function stopAlertBeep() {
  if (!activeBeepAudio) {
    return
  }

  activeBeepAudio.pause()
  activeBeepAudio.currentTime = 0
}
