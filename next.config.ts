import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs usa require() dinámicos y módulos de Node; conviene dejarlo afuera del bundle.
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
