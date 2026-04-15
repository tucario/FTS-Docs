// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightVersions from 'starlight-versions';
import mermaid from 'astro-mermaid';

export default defineConfig({
	site: 'https://tucario.github.io',
	base: '/FTS-Docs',
	integrations: [
		mermaid(),
		starlight({
			title: 'Flexible Team Share',
			logo: {
				src: './src/assets/logo.png',
				alt: 'Flexible Team Share Logo',
			},
			customCss: ['./src/styles/custom.css'],
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				de: { label: 'Deutsch', lang: 'de' },
				fr: { label: 'Français', lang: 'fr' },
				es: { label: 'Español', lang: 'es' },
				ja: { label: '日本語', lang: 'ja' },
				pt: { label: 'Português', lang: 'pt' },
				pl: { label: 'Polski', lang: 'pl' },
				ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
			},
			plugins: [
				starlightVersions({
					versions: [{ slug: '1.0' }],
				}),
			],
			sidebar: [
				{
					label: 'Getting Started',
					translations: {
						de: 'Erste Schritte',
						fr: 'Premiers pas',
						es: 'Primeros pasos',
						ja: 'はじめに',
						pt: 'Primeiros passos',
						pl: 'Pierwsze kroki',
						ar: 'البدء',
					},
					items: [
						{ slug: 'getting-started/installation' },
						{ slug: 'getting-started/configuration' },
					],
				},
				{
					label: 'Architecture',
					translations: {
						de: 'Architektur',
						fr: 'Architecture',
						es: 'Arquitectura',
						ja: 'アーキテクチャ',
						pt: 'Arquitetura',
						pl: 'Architektura',
						ar: 'البنية',
					},
					items: [
						{ slug: 'architecture/overview' },
						{ slug: 'architecture/data-model' },
						{ slug: 'architecture/security' },
						{ slug: 'architecture/sharing-model' },
					],
				},
				{
					label: 'Use Cases',
					translations: {
						de: 'Anwendungsfälle',
						fr: "Cas d'utilisation",
						es: 'Casos de uso',
						ja: 'ユースケース',
						pt: 'Casos de uso',
						pl: 'Przypadki użycia',
						ar: 'حالات الاستخدام',
					},
					items: [
						{ slug: 'use-cases/overview' },
						{ slug: 'use-cases/initial-setup' },
						{ slug: 'use-cases/manage-team' },
						{ slug: 'use-cases/admin-tasks' },
					],
				},
				{
					label: 'Release Notes',
					translations: {
						de: 'Versionshinweise',
						fr: 'Notes de version',
						es: 'Notas de la versión',
						ja: 'リリースノート',
						pt: 'Notas de versão',
						pl: 'Informacje o wersji',
						ar: 'ملاحظات الإصدار',
					},
					items: [
						{ slug: 'release-notes/overview' },
						{ slug: 'release-notes/changelog' },
						{ slug: 'release-notes/1-0' },
					],
				},
				{
					label: 'Internal',
					collapsed: true,
					translations: {
						de: 'Intern',
						fr: 'Interne',
						es: 'Interno',
						ja: '内部',
						pt: 'Interno',
						pl: 'Wewnętrzne',
						ar: 'داخلي',
					},
					items: [
						{ slug: 'internal/package-build' },
						{ slug: 'internal/2gp-release' },
						{ slug: 'internal/appexchange' },
						{ slug: 'internal/security-scan' },
						{ slug: 'internal/false-positives' },
					{ slug: 'internal/false-positives2' },
					],
				},
			],
		}),
	],
});
