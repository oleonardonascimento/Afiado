"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import { catalogKeys, reviewKeys } from "@/lib/query-keys";

export function useShop() {
  return useQuery({ queryKey: catalogKeys.shop, queryFn: () => repos.shop.get() });
}

export function useServices() {
  return useQuery({ queryKey: catalogKeys.services, queryFn: () => repos.services.list() });
}

export function useProfessionals() {
  return useQuery({
    queryKey: catalogKeys.professionals,
    queryFn: () => repos.professionals.list(),
  });
}

export function useProducts() {
  return useQuery({ queryKey: catalogKeys.products, queryFn: () => repos.products.list() });
}

export function usePlans() {
  return useQuery({ queryKey: catalogKeys.plans, queryFn: () => repos.plans.list() });
}

export function useTimeOff() {
  return useQuery({ queryKey: catalogKeys.timeOff, queryFn: () => repos.timeOff.list() });
}

export function useReviews() {
  return useQuery({ queryKey: reviewKeys.all, queryFn: () => repos.reviews.list() });
}
