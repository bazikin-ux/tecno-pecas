import Link from "next/link";

export default function SucessoPage() {
  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
      <div className="mx-auto max-w-3xl rounded-2xl bg-[#2b2d31] p-8">
        <p className="text-sm font-bold text-[#b5bac1]">Tecno Pecas</p>
        <h1 className="mt-2 text-4xl font-black text-[#23a559]">
          Obrigado pela compra!
        </h1>

        <p className="mt-4 text-[#b5bac1]">
          Seu pedido foi recebido e enviado para processamento. A Tecno Pecas agradece pela confianca na nossa loja e deseja que voce tenha uma otima semana!
        </p>

        <div className="mt-6 rounded-xl bg-[#1e1f22] p-5">
          <p className="text-sm font-bold text-[#b5bac1]">Produto comprado</p>
          <h2 className="mt-2 text-2xl font-black">Seu produto esta sendo preparado</h2>
          <p className="mt-2 text-[#b5bac1]">
            Assim que o pedido avancar, voce podera acompanhar tudo pela tela de rastreamento.
          </p>
        </div>

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
