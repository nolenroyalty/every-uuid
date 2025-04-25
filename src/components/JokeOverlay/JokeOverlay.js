import React from "react";
import styled from "styled-components";
import forge from "node-forge";
const Overlay = styled.div`
  position: fixed;
  top: 5%;
  right: 5%;
  z-index: 1000;
  background-color: var(--slate-400);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--slate-500);
  font-family: monospace;
`;

function isAscii(str) {
  return /^[\x20-\x7F]*$/.test(str);
}

function startsWithTh(str) {
  return str.startsWith("Th");
}

function lengthAtLeast3(str) {
  return str.length >= 3;
}

const encryptedBase64 =
  "U2FsdGVkX19zQCWo/QFwcwv/xn/qeyn6aLGizL9qReGGHNf7J+4+oQOmdnNnY2BmomnJytdKLnuSfLBzNf1Op7mSBSVyNr6ZWiaXnueFojM=";
const encryptedData = forge.util.decode64(encryptedBase64);

export function useUUIDDecryptor() {
  const [status, setStatus] = React.useState("idle");
  const [decryptedText, setDecryptedText] = React.useState(null);

  const tryUUID = React.useCallback((uuid) => {
    setStatus("decrypting");

    try {
      // Check for "Salted__" prefix
      if (encryptedData.substring(0, 8) !== "Salted__") {
        throw new Error("Not a valid OpenSSL encrypted file");
      }

      // Extract salt (next 8 bytes)
      const salt = encryptedData.substring(8, 16);

      // Derive key and IV (using SHA-256 by default)
      const keySize = 32; // 256 bits
      const ivSize = 16; // 128 bits
      const derivedBytes = forge.pbe.opensslDeriveBytes(
        uuid,
        salt,
        keySize + ivSize,
        forge.md.sha256.create()
      );

      const key = derivedBytes.substring(0, keySize);
      const iv = derivedBytes.substring(keySize);

      // Create decipher
      const decipher = forge.cipher.createDecipher("AES-CBC", key);
      decipher.start({ iv: iv });

      // Add encrypted data
      decipher.update(forge.util.createBuffer(encryptedData.substring(16)));

      // Finish
      const success = decipher.finish();

      if (success) {
        // Get output
        const decrypted = decipher.output.data;
        if (
          isAscii(decrypted) &&
          lengthAtLeast3(decrypted) &&
          startsWithTh(decrypted)
        ) {
          setStatus("success");
          setDecryptedText(decrypted);
          return true;
        } else {
          setDecryptedText("");
          setStatus("failure");
          return false;
        }
      } else {
        setDecryptedText("");
        setStatus("failure");
        return false;
      }
    } catch (error) {
      console.error("Decryption error:", error);
      setDecryptedText("");
      setStatus("failure");
      return false;
    }
  }, []);

  return {
    tryUUID,
    status,
    decryptedText,
  };
}

function JokeOverlay({ firstUuid }) {
  const { tryUUID, status, decryptedText } = useUUIDDecryptor();

  React.useEffect(() => {
    if (firstUuid) {
      tryUUID(firstUuid);
    }
  }, [tryUUID, firstUuid]);

  return (
    <Overlay>
      <div>
        <h2>Find Theo's UUID and Win $1,000!!!</h2>
        <p>Current UUID: {firstUuid}</p>
        <p style={{ color: status === "success" ? "#016630" : "#fb2c36" }}>
          Decryption Status: {status}
        </p>
        <p>Decrypted Text: {decryptedText}</p>
      </div>
    </Overlay>
  );
}

export default JokeOverlay;
