// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ratify',
  // tagline: 'Dinosaurs are cool',
  // favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-test-site.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Deislabs', // Usually your GitHub org/user name.
  projectName: 'Ratify', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  stylesheets: [
    //Add Font Awesome stylesheets
    '/fonts/font-awesome/fontawesome.css',
    '/fonts/font-awesome/solid.css',
    '/fonts/font-awesome/regular.css',
    '/fonts/font-awesome/brands.css'
  ],


  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/deislabs/ratify-web/',
          lastVersion: 'current',
          versions: {
            current: {
              label: '1.0.0-rc.5',
              path: '1.0.0-rc.5',
            },
          },
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/deislabs/ratify-web/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Ratify',
        // logo: {
        //   alt: 'My Site Logo',
        //   src: 'img/logo.svg',
        // },
        items: [
          {
            type: 'doc',
            docId: 'what-is-ratify',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {to: 'https://killercoda.com/notaryproject/scenario/ratify', label: 'Playground', position: 'left'},
          {
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownActiveClassDisabled: true,
          },
          {
            to: 'https://cloud-native.slack.com/?redir=%2Farchives%2FC03T3PEKVA9',
            label: ' ',
            position: 'right',
            target: '_blank',
            className: 'fab fa-lg fa-slack',
          },
          {
            to: 'https://github.com/deislabs/ratify',
            label: ' ',
            position: 'right',
            target: '_blank',
            className: 'fab fa-lg fa-github',
          },
          {
            to: 'https://twitter.com/artifact_ratify',
            label: ' ',
            position: 'right',
            target: '_blank',
            className: 'fab fa-lg fa-twitter',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Documentation',
                to: 'docs/1.0.0-rc.6/what-is-ratify',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Github',
                href: 'https://github.com/deislabs/ratify',
              },
              {
                label: 'Slack',
                href: 'https://cloud-native.slack.com/?redir=%2Farchives%2FC03T3PEKVA9',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/artifact_ratify',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'Playground',
                to: 'https://killercoda.com/notaryproject/scenario/ratify',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ratify Project`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
