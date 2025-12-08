"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";

type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
};

type PageResponse<T> = {
  items: T[];
  page: number;
  hasNext: boolean;
};

export default function ModerationPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["supportContacts", page],
    queryFn: () => api.get<PageResponse<Contact>>(`/dashboard/support/contacts?page=${page}&pageSize=20`),
    placeholderData: (prev) => prev
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#374151]">Moderação</h1>

      <div className="bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-[#6B7280] border-b border-gray-200">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Mensagem</th>
              <th className="py-3 px-4">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-3 px-4" colSpan={5}>
                  Carregando...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="py-3 px-4 text-red-600" colSpan={5}>
                  Erro ao carregar contatos
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td className="py-3 px-4 text-[#6B7280]" colSpan={5}>
                  Nenhum contato encontrado.
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="py-3 px-4 text-xs text-[#6B7280]">
                  <Link href={`/moderation/${c.id}`} className="text-[#B55D05] hover:underline">
                    {c.id}
                  </Link>
                </td>
                <td className="py-3 px-4 font-semibold text-[#374151]">{c.name}</td>
                <td className="py-3 px-4 text-[#6B7280]">{c.email}</td>
                <td className="py-3 px-4 text-[#374151]">{c.message}</td>
                <td className="py-3 px-4 text-[#6B7280]">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-[#374151]">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
        >
          Anterior
        </button>
        <div>
          Página {data ? data.page : page + 1} {data?.hasNext ? "" : "(última)"}
        </div>
        <button
          disabled={!data?.hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
