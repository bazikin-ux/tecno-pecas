import Link from "next/link";

export default function SucessoPage() {
  return (
    <main className="min-h-screen bg-[#313338] p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-[#2b2d31] p-8">
        <h1 className="text-4xl font-black text-[#23a559]">
          Pagamento recebido!
        </h1>

        <p className="mt-4 text-[#b5bac1]">
          Seu pedido foi enviado para processamento.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#5865f2] px-5 py-3 font-bold"
        >
          Voltar para a Tecno Peças
        </Link>

        <Link
          href="/rastreamento"
          className="ml-3 mt-6 inline-block rounded-lg bg-[#23a559] px-5 py-3 font-bold"
        >
          Rastrear pedido
        </Link>
      </div>
    </main>
  );
}
