import Cookies from "js-cookie";
import forge from "node-forge";

export type EncryptedMsg = {
  encryptedTransferKey: string;
  iv: string;
  message: string;
};

export const makeTransferKey = (pem: string) => {
  const rawTransferKey = forge.random.getBytesSync(32);
  const publicKey = forge.pki.publicKeyFromPem(pem);
  const encryptedTransferKey = forge.util.encode64(
    publicKey.encrypt(rawTransferKey, "RSA-OAEP"),
  );

  return { rawTransferKey, encryptedTransferKey };
};

export const decodeTransferKey = (key: string) => {
  const pem = Cookies.get("privateKey");
  if (!pem) return;

  const encryptedKey = forge.util.decode64(key);

  const privateKey = forge.pki.privateKeyFromPem(pem);
  return privateKey.decrypt(encryptedKey, "RSA-OAEP");
};

export const encrypt = (
  publicKey: string,
  message: {
    sender: {
      cuid: string;
      displayName: string;
    };
    text: string;
  },
): EncryptedMsg => {
  const { rawTransferKey, encryptedTransferKey } = makeTransferKey(publicKey);
  const iv = forge.random.getBytesSync(16);

  const cipher = forge.cipher.createCipher("AES-CBC", rawTransferKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(JSON.stringify(message)));
  cipher.finish();

  return {
    encryptedTransferKey,
    iv: forge.util.encode64(iv),
    message: forge.util.encode64(cipher.output.getBytes()),
  };
};

export const decrypt = (message: EncryptedMsg) => {
  const rawTransferKey = decodeTransferKey(message.encryptedTransferKey);

  if (!rawTransferKey) return;

  const iv = forge.util.decode64(message.iv);
  const encryptedMessage = forge.util.decode64(message.message);

  const decipher = forge.cipher.createDecipher("AES-CBC", rawTransferKey);
  decipher.start({ iv });
  decipher.update(forge.util.createBuffer(encryptedMessage));
  decipher.finish();

  return JSON.parse(decipher.output.toString());
};
