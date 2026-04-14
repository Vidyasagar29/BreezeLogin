(function () {
  const config = window.APP_CONFIG || {};

  const openLoginButton = document.getElementById("open-login");
  const copyLoginButton = document.getElementById("copy-login");
  const form = document.getElementById("token-form");
  const adminPinInput = document.getElementById("admin-pin");
  const accessCodeInput = document.getElementById("access-code");
  const noteInput = document.getElementById("note");
  const result = document.getElementById("result");
  const configStatus = document.getElementById("config-status");

  const placeholderFunctionUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/breeze-token";

  function hasMissingConfig() {
    return !config.EDGE_FUNCTION_URL || config.EDGE_FUNCTION_URL === placeholderFunctionUrl;
  }

  function setMessage(element, message, type) {
    element.textContent = message;
    element.className = element === configStatus ? "status" : "result";
    if (type) {
      element.classList.add(type);
    }
  }

  async function callEdgeFunction(payload) {
    if (hasMissingConfig()) {
      throw new Error("Update config.js with your Supabase Edge Function URL first.");
    }

    const adminPin = adminPinInput.value.trim();
    if (!adminPin) {
      throw new Error("Enter your admin PIN first.");
    }

    const response = await fetch(config.EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": adminPin
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(body.error || `Request failed with ${response.status}`);
    }

    return body;
  }

  async function getLoginUrl() {
    const body = await callEdgeFunction({ action: "login-url" });
    return body.login_url;
  }

  function extractAccessCode(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    try {
      const url = new URL(trimmed);
      return (
        url.searchParams.get("API_Session") ||
        url.searchParams.get("api_session") ||
        url.searchParams.get("session_token") ||
        trimmed
      );
    } catch (_error) {
      return trimmed;
    }
  }

  function prefillFromCurrentUrl() {
    const params = new URLSearchParams(window.location.search);
    const code =
      params.get("API_Session") ||
      params.get("api_session") ||
      params.get("session_token");

    if (code) {
      accessCodeInput.value = code;
      setMessage(result, "Access code found in the page URL. Review it and save.", "success");
    }
  }

  async function saveAccessCode(accessCode, note) {
    return callEdgeFunction({
      action: "save-code",
      access_code: accessCode,
      note: note || null
    });
  }

  openLoginButton.addEventListener("click", async function () {
    try {
      const loginUrl = await getLoginUrl();
      window.open(loginUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(result, error.message, "error");
    }
  });

  copyLoginButton.addEventListener("click", async function () {
    try {
      const loginUrl = await getLoginUrl();
      await navigator.clipboard.writeText(loginUrl);
      setMessage(result, "Breeze login link copied.", "success");
    } catch (error) {
      setMessage(result, error.message, "error");
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (hasMissingConfig()) {
      setMessage(configStatus, "Update config.js with your Supabase Edge Function URL first.", "error");
      return;
    }

    const accessCode = extractAccessCode(accessCodeInput.value);
    if (!accessCode) {
      setMessage(result, "Paste the access code before saving.", "error");
      return;
    }

    form.querySelector("button[type='submit']").disabled = true;
    setMessage(result, "Saving access code...");

    try {
      await saveAccessCode(accessCode, noteInput.value.trim());
      accessCodeInput.value = accessCode;
      setMessage(result, "Saved. Your programs can now read the latest access code from Supabase.", "success");
    } catch (error) {
      setMessage(result, `Could not save to Supabase: ${error.message}`, "error");
    } finally {
      form.querySelector("button[type='submit']").disabled = false;
    }
  });

  if (hasMissingConfig()) {
    setMessage(configStatus, "Add your Supabase Edge Function URL in config.js before using this page.", "error");
  } else {
    setMessage(configStatus, "Ready. Enter your admin PIN to open Breeze login or save a code.");
  }

  prefillFromCurrentUrl();
})();
