import {
  configuredContractAddress,
  explorerTokenUrl,
  isContractConfigured,
  normalizeUri
} from "../lib/contract";
import { normalizeImageUrl, type TokenMetadata } from "../lib/metadata";

type TokenItem = {
  id: number;
  tokenURI: string;
  metadata: TokenMetadata | null;
};

type TokenGalleryProps = {
  tokens: TokenItem[];
  loading: boolean;
};

export function TokenGallery({ tokens, loading }: TokenGalleryProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Collector View</span>
          <h2>Your wallet collection</h2>
        </div>
        <p>Mint qilingan tokenlar shu yerda preview qilinadi va metadata havolalari bilan ko'rsatiladi.</p>
      </div>

      {loading ? <div className="empty-state"><h3>Loading tokens...</h3></div> : null}

      {!loading && tokens.length === 0 ? (
        <div className="empty-state">
          <h3>No NFTs in this wallet yet</h3>
          <p>Mint qilingandan keyin preview, traits va metadata shu yerda ko'rinadi.</p>
        </div>
      ) : null}

      <div className="token-grid">
        {tokens.map((token) => (
          <article key={token.id} className="token-card">
            {token.metadata?.image ? (
              <img
                className="token-card__image"
                src={normalizeImageUrl(token.metadata.image)}
                alt={token.metadata.name || `Token ${token.id}`}
              />
            ) : (
              <div className="token-card__placeholder">AZNFT</div>
            )}

            <div className="token-card__content">
              <div className="token-card__headline">
                <span>Token #{token.id}</span>
                {isContractConfigured() ? (
                  <a
                    href={explorerTokenUrl(configuredContractAddress, token.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explorer
                  </a>
                ) : null}
              </div>

              <h3>{token.metadata?.name || "Untitled metadata"}</h3>
              <p>{token.metadata?.description || "Metadata preview could not be resolved."}</p>

              <div className="token-card__traits">
                {token.metadata?.attributes?.map((attribute) => (
                  <span key={`${attribute.trait_type}-${attribute.value}`} className="trait-pill">
                    {attribute.trait_type}: {attribute.value}
                  </span>
                ))}
              </div>

              <a href={normalizeUri(token.tokenURI)} target="_blank" rel="noreferrer">
                Open metadata
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
