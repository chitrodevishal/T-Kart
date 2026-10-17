import dns from 'node:dns';

/**
 * Optionally override Node's c-ares DNS servers for environments whose default
 * resolver cannot resolve MongoDB Atlas SRV records. Leave unset to use the OS
 * defaults.
 */
export function configureDnsServers() {
  const configuredServers = process.env.NODE_DNS_SERVERS;
  if (!configuredServers) return;

  const servers = configuredServers.split(',').map((server) => server.trim()).filter(Boolean);
  if (servers.length === 0) return;

  dns.setServers(servers);
  console.log(`Using configured DNS servers for Node: ${servers.join(', ')}`);
}
