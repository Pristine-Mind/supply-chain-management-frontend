import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { CheckIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export type AccountType = "buyer" | "seller";

export interface AccountDialogProps {
  defaultOpen?: boolean;
  onSelect?: (account: AccountType) => void;
  onOpenChange?: (open: boolean) => void;
}

export const AccountDialog: React.FC<AccountDialogProps> = ({
  defaultOpen = true,
  onSelect,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  const [accountType, setAccountType] = useState<AccountType>("buyer");

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const handleContinue = () => {
    setOpen(false);
    onSelect?.(accountType);
    
    if (accountType === 'buyer') {
      navigate('/register');
    } else if (accountType === 'seller') {
      navigate('/business-register');
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[1000]" />

        <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl overflow-hidden md:flex z-[1001] border border-gray-200">
          
          <div className="hidden md:flex w-1/2 items-center justify-center p-6">
            <img
              src={logo}
              alt="Mulya Bazzar"
              className="max-w-xs"
            />
          </div>

          <div className="w-full md:w-1/2 p-8 relative flex flex-col">
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </Dialog.Close>

            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              Create your account
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-6">
              Choose the role that best describes how you’ll use our platform.
            </p>

            <RadioGroup.Root
              value={accountType}
              onValueChange={(v) => setAccountType(v as AccountType)}
              className="flex flex-col gap-4 mb-8"
            >
              {(["buyer", "seller"] as AccountType[]).map((type) => {
                const isBuyer = type === "buyer";
                return (
                  <RadioGroup.Item
                    key={type}
                    value={type}
                    id={`role-${type}`}
                    className={`flex items-start p-4 rounded-lg border transition 
                      ${
                        accountType === type
                          ? isBuyer
                            ? "border-orange-600 bg-orange-50"
                            : "border-amber-500 bg-amber-50"
                          : "border-gray-300 hover:border-gray-400"
                      }
                      focus:outline-none focus:ring-2 ${
                        isBuyer ? "focus:ring-orange-500" : "focus:ring-amber-500"
                      }`}
                  >
                    <RadioGroup.Indicator className="mt-1 mr-3">
                      <CheckIcon className={isBuyer ? "text-orange-600" : "text-amber-500"} />
                    </RadioGroup.Indicator>
                    <div>
                      <label
                        htmlFor={`role-${type}`}
                        className="font-medium text-gray-900"
                      >
                        {isBuyer ? "Buyer" : "Seller"}
                      </label>
                      <p className="text-sm text-gray-600">
                        {isBuyer
                          ? "Discover and source thousands of quality products."
                          : "List your products and reach buyers all over Nepal."}
                      </p>
                    </div>
                  </RadioGroup.Item>
                );
              })}
            </RadioGroup.Root>

            <button
              onClick={handleContinue}
              className="mt-auto w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-amber-600 transition"
            >
              Continue
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AccountDialog;
