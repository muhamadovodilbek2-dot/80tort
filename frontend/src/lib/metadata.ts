export type TokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{ trait_type?: string; value?: string }>;
};

export type MetadataForm = {
  name: string;
  description: string;
  image: string;
  externalUrl: string;
  attributesText: string;
  customUri: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return window.btoa(binary);
}

export function buildMetadataDataUri(form: MetadataForm) {
  const attributes = form.attributesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [trait, ...rest] = line.split(":");

      return {
        trait_type: trait.trim(),
        value: rest.join(":").trim()
      };
    })
    .filter((entry) => entry.trait_type && entry.value);

  const metadata = {
    name: form.name.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    external_url: form.externalUrl.trim() || undefined,
    attributes
  };

  const bytes = new TextEncoder().encode(JSON.stringify(metadata));
  return `data:application/json;base64,${bytesToBase64(bytes)}`;
}

export function decodeDataUri(uri: string) {
  const base64 = uri.split(",")[1] || "";
  const binary = window.atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export async function resolveMetadata(uri: string) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("data:application/json;base64,")) {
    return JSON.parse(decodeDataUri(uri)) as TokenMetadata;
  }

  const response = await fetch(uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri);

  if (!response.ok) {
    throw new Error("Metadata fetch failed");
  }

  return (await response.json()) as TokenMetadata;
}

export function normalizeImageUrl(image?: string) {
  if (!image) {
    return "";
  }

  if (image.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${image.slice(7)}`;
  }

  return image;
}
