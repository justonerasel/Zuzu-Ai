export type MicrophonePermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

const MIC_STORAGE_KEY = 'zuzu_mic_permission_status';

export interface PermissionCheckResult {
  state: MicrophonePermissionState;
  isSupported: boolean;
  canRequest: boolean;
}

/**
 * Checks current microphone permission state without triggering a prompt
 */
export async function checkMicrophonePermission(): Promise<PermissionCheckResult> {
  if (typeof window === 'undefined' || !navigator?.mediaDevices) {
    return { state: 'unsupported', isSupported: false, canRequest: false };
  }

  // 1. Check via Permissions API if available
  if (navigator.permissions && typeof navigator.permissions.query === 'function') {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const state = status.state as MicrophonePermissionState;
      localStorage.setItem(MIC_STORAGE_KEY, state);
      return {
        state,
        isSupported: true,
        canRequest: state === 'prompt' || state === 'denied'
      };
    } catch {
      // Some browsers (like Safari/certain Android WebViews) throw on microphone queries
    }
  }

  // 2. Fall back to cached permission state if Permissions API is not supported
  const cached = localStorage.getItem(MIC_STORAGE_KEY) as MicrophonePermissionState | null;
  if (cached === 'granted') {
    return { state: 'granted', isSupported: true, canRequest: false };
  }

  return {
    state: cached || 'prompt',
    isSupported: true,
    canRequest: true
  };
}

export interface PermissionRequestResult {
  success: boolean;
  state: MicrophonePermissionState;
  error?: string;
  isPermanentDenied?: boolean;
}

/**
 * Requests genuine runtime Android microphone permission via getUserMedia
 */
export async function requestMicrophonePermission(): Promise<PermissionRequestResult> {
  if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
    return {
      success: false,
      state: 'unsupported',
      error: 'MediaDevices audio API is not supported on this device/browser.'
    };
  }

  try {
    // Invoke genuine runtime permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Permission granted! Immediately stop tracks so mic is freed for SpeechRecognition
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    localStorage.setItem(MIC_STORAGE_KEY, 'granted');

    return {
      success: true,
      state: 'granted'
    };
  } catch (err: any) {
    const errorName = err?.name || '';
    const isDenied = errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError';

    localStorage.setItem(MIC_STORAGE_KEY, 'denied');

    return {
      success: false,
      state: 'denied',
      isPermanentDenied: isDenied,
      error: err?.message || 'Microphone permission request was denied.'
    };
  }
}

/**
 * Android Application Settings Helper
 */
export function openAndroidAppSettingsGuide(): void {
  // On real Android devices, trying intent URL opens app settings if supported
  if (/Android/i.test(navigator.userAgent)) {
    try {
      window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=com.zuzu.ai.assistant;end;';
    } catch {}
  }
}
