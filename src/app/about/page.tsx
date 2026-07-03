import type { Metadata } from 'next';
import { Layers, TrendingUp, HeartHandshake, ShieldCheck } from 'lucide-react';
import {
  MarketingHeader,
  MarketingFooter,
  PageHero,
  SectionHeading,
  CtaBand,
} from '@/components/marketing/SiteChrome';

export const metadata: Metadata = {
  title: 'About | Avori',
  description:
    'Avori is the all-in-one commerce experience platform: one dashboard, one customer database, one AI layer, built to end app sprawl for ecommerce brands.',
};

const values = [
  {
    icon: Layers,
    title: 'All-in-One',
    copy: 'Everything you need in one platform. One login, one customer database, one bill, not fifteen apps duct-taped together.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Driven',
    copy: 'Every module exists to move a number a merchant cares about: conversion, AOV, repeat rate. If it doesn’t grow the store, it doesn’t ship.',
  },
  {
    icon: HeartHandshake,
    title: 'Customer First',
    copy: 'Shoppers get experiences that feel personal, shade matching, honest reviews, rewards that actually reward. Merchants get customers who come back.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable & Secure',
    copy: 'Enterprise-grade guardrails by default: tenant isolation, hashed keys, signed webhooks, audit logs. Trust is a feature, not a tier.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="About Avori"
          title={
            <>
              We’re ending
              <br />
              <span className="text-gradient-brand">app sprawl</span> in ecommerce.
            </>
          }
          sub="Avori is the all-in-one commerce experience platform built to help online stores increase sales, engage customers, and build loyalty, without the chaos of multiple apps."
        />

        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="space-y-5 text-base leading-relaxed text-fg-muted">
            <p>
              Every growing store hits the same wall. Reviews live in one app, loyalty in another,
              quizzes in a third, video in a fourth. Each has its own login, its own bill, its own
              copy of your customers, and none of them talk to each other. The stack that was
              supposed to grow the store starts slowing it down.
            </p>
            <p>
              Avori started as a shoppable-video tool for beauty brands. Working with merchants, we
              kept hearing the same thing: the problem wasn’t any single tool, it was the seams
              between them. So we rebuilt the whole customer experience layer as one system:{' '}
              <span className="font-semibold text-fg">
                one dashboard, one customer database, one analytics engine, one AI layer
              </span>{' '}
              powering every feature.
            </p>
            <p>
              We build beauty-first, shade matching, try-on, UGC, because beauty is where customer
              experience is most demanding. But the platform is industry-agnostic by design:
              anything a fashion, wellness or lifestyle brand needs from a growth stack, Avori does
              from the same unified core.
            </p>
            <p>
              Today Avori ships fifteen-plus modules, native Shopify and WooCommerce connectors,
              server-side marketing destinations, and an API a headless team can build on in an
              afternoon. One platform. Every growth tool.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="What we believe" title="The principles behind the platform" />
            <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title} className="rounded-xl border border-border bg-surface p-6 shadow-soft">
                  <v.icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-3 font-semibold text-fg">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{v.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-4 text-center sm:grid-cols-3">
            {[
              ['15+', 'modules on one platform'],
              ['1', 'customer database behind everything'],
              ['4', 'marketing destinations built in'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-border bg-surface p-6 shadow-soft">
                <div className="text-3xl font-bold tracking-tight text-accent">{v}</div>
                <div className="mt-2 text-sm text-fg-muted">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <CtaBand
          title="Build your customer experience on one platform"
          sub="Join the brands replacing app sprawl with Avori."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}
