import type { FormEvent } from "react";
import { Search } from "lucide-react";

type GlobalSearchProps = {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function GlobalSearch({ value, loading, onChange, onSubmit }: GlobalSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="global-search" onSubmit={handleSubmit}>
      <label htmlFor="global-search-input">Pesquisa operacional</label>
      <div className="search-row">
        <div className="search-input-shell">
          <Search size={18} strokeWidth={1.8} />
          <input
            id="global-search-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Pesquisar matricula, serial, hostname, nome ou e-mail"
            autoFocus
          />
        </div>
        <button type="submit" disabled={loading || value.trim().length < 2}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>
    </form>
  );
}
