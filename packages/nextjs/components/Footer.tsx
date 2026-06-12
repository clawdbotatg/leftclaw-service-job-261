import React from "react";
import { SwitchTheme } from "~~/components/SwitchTheme";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-end items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <SwitchTheme className="pointer-events-auto" />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <span className="text-center">Labs #36 Ship-to-Earn</span>
            <span>·</span>
            <span className="text-center">Built on Base</span>
            <span>·</span>
            <span className="text-center">Open Source</span>
          </div>
        </ul>
      </div>
    </div>
  );
};
