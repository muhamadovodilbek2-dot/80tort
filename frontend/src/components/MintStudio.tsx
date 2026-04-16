import type { MetadataForm } from "../lib/metadata";

type MintStudioProps = {
  connected: boolean;
  saleActive: boolean;
  mintPrice: string;
  mintMode: "builder" | "custom";
  mintForm: MetadataForm;
  previewUri: string;
  submitting: boolean;
  onMintModeChange: (mode: "builder" | "custom") => void;
  onMintFormChange: (field: keyof MetadataForm, value: string) => void;
  onSubmit: () => void;
};

export function MintStudio({
  connected,
  saleActive,
  mintPrice,
  mintMode,
  mintForm,
  previewUri,
  submitting,
  onMintModeChange,
  onMintFormChange,
  onSubmit
}: MintStudioProps) {
  return (
    <section className="panel panel--featured">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Mint Studio</span>
          <h2>Metadata builder + direct mint flow</h2>
        </div>
        <p>
          IPFS URI kiriting yoki formadan to'g'ridan-to'g'ri `data:` metadata yarating. Har bir
          mint holder governance’ga kirish huquqini beradi.
        </p>
      </div>

      <div className="mode-toggle">
        <button
          type="button"
          className={mintMode === "builder" ? "is-active" : ""}
          onClick={() => onMintModeChange("builder")}
        >
          Builder
        </button>
        <button
          type="button"
          className={mintMode === "custom" ? "is-active" : ""}
          onClick={() => onMintModeChange("custom")}
        >
          Custom URI
        </button>
      </div>

      {mintMode === "builder" ? (
        <div className="form-grid">
          <label>
            NFT name
            <input
              value={mintForm.name}
              onChange={(event) => onMintFormChange("name", event.target.value)}
              placeholder="AzizbekCE Genesis #001"
            />
          </label>
          <label>
            Image URL
            <input
              value={mintForm.image}
              onChange={(event) => onMintFormChange("image", event.target.value)}
              placeholder="ipfs://... yoki https://..."
            />
          </label>
          <label className="label-span-2">
            Description
            <textarea
              rows={4}
              value={mintForm.description}
              onChange={(event) => onMintFormChange("description", event.target.value)}
              placeholder="Collection story, utility va mint narrative..."
            />
          </label>
          <label>
            External URL
            <input
              value={mintForm.externalUrl}
              onChange={(event) => onMintFormChange("externalUrl", event.target.value)}
              placeholder="https://azizbekce.uz"
            />
          </label>
          <label>
            Traits
            <textarea
              rows={4}
              value={mintForm.attributesText}
              onChange={(event) => onMintFormChange("attributesText", event.target.value)}
              placeholder={"Artist: Azizbek\nUtility: Governance\nTier: Genesis"}
            />
          </label>
        </div>
      ) : (
        <label>
          Custom metadata URI
          <textarea
            rows={8}
            value={mintForm.customUri}
            onChange={(event) => onMintFormChange("customUri", event.target.value)}
            placeholder="ipfs://CID/metadata.json yoki data:application/json;base64,..."
          />
        </label>
      )}

      <div className="mint-preview">
        <div>
          <span className="eyebrow">Prepared Token URI</span>
          <p>{previewUri ? `${previewUri.slice(0, 120)}...` : "URI tayyorlanmagan"}</p>
        </div>
        <div className="mint-preview__meta">
          <span>{saleActive ? "Sale active" : "Sale paused"}</span>
          <strong>{mintPrice}</strong>
        </div>
      </div>

      <button
        type="button"
        className="cta-button"
        disabled={!connected || !saleActive || submitting}
        onClick={onSubmit}
      >
        {submitting ? "Minting..." : connected ? "Mint NFT" : "Connect wallet to mint"}
      </button>
    </section>
  );
}
