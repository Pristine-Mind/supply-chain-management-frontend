import React from 'react';
import { Link } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { styled } from '@stitches/react';
import logo from '../assets/logo.png';

// Tailwind-friendly wrapper for stitches, you can omit styled if using pure Tailwind
const MenuList = styled(NavigationMenu.List, {
  display: 'flex',
  gap: '1rem',
});

export const Navbar: React.FC = () => (
  <NavigationMenu.Root>
    <div className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <NavigationMenu.List className="flex items-center justify-between h-16">
          <NavigationMenu.Item>
            <Link to="/marketplace" className="text-2xl font-bold text-orange-600">
              <img src={logo} alt="Logo" className="w-12 h-12" />
            </Link>
          </NavigationMenu.Item>

          <MenuList>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link to="/marketplace" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                  Marketplace
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link to="/blog" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                  Blog
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link to="/contact" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                  Contact
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </MenuList>
        </NavigationMenu.List>
      </div>
    </div>
  </NavigationMenu.Root>
);

export default Navbar;
