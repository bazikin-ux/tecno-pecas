export default function PendentePage() {
  return (
    <main className="min-h-screen bg-[#313338] p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-[#2b2d31] p-8">
        <h1 className="text-4xl font-black text-yellow-400">
          Pagamento pendente
        </h1>

        <p className="mt-4 text-[#b5bac1]">
          Seu pagamento ainda está em análise ou aguardando confirmação.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#5865f2] px-5 py-3 font-bold"
        >
          Voltar para a Tecno Peças
        </a>
      </div>
    </main>
  );
}