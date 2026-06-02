import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkPaymentStatus } from '@/services/paymentService';
import { getOrderById } from '@/services/orderService';
import { CheckCircle, Printer, Plus, ShoppingBag, XCircle } from "lucide-react";
import { formatCurrency } from "@/utils/helpers";
import { useAuthStore } from "@/stores";
import toast from "react-hot-toast";

export default function PosOrderSuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const { user } = useAuthStore();

    const [status, setStatus] = useState("Loading...");
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Check payment status
                const statusRes = await checkPaymentStatus(orderId);
                const currentStatus = statusRes.data;
                setStatus(currentStatus);

                // 2. If success, fetch full order details for receipt
                if (currentStatus === "PAID" || currentStatus === "SUCCESS" || currentStatus === "COMPLETED") {
                    const orderRes = await getOrderById(orderId);
                    setOrderData(orderRes.data?.data || orderRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch order details", error);
                // If 404, the order might have been deleted because it failed
                if (error.response?.status === 404) {
                    setStatus("CANCELLED");
                } else {
                    toast.error("Không thể tải thông tin đơn hàng");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orderId]);

    const isSuccess = status === "PAID" || status === "SUCCESS" || status === "COMPLETED";

    const handlePrintReceipt = () => {
        if (!orderData) return;

        const receiptWindow = window.open("", "_blank");
        const receiptHtml = `
            <html>
                <head>
                    <title>Receipt #${orderData.id}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; color: #333; }
                        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px; }
                        .store-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                        .info { font-size: 12px; margin-bottom: 5px; }
                        table { width: 100%; font-size: 12px; margin-bottom: 15px; border-collapse: collapse; }
                        th { text-align: left; border-bottom: 1px solid #eee; padding: 5px 0; }
                        td { padding: 5px 0; }
                        .total-row { border-top: 2px dashed #ccc; padding-top: 10px; font-weight: bold; font-size: 16px; margin-top: 10px; display: flex; justify-content: space-between; }
                        .footer { text-align: center; font-size: 10px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
                        .tag { display: inline-block; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="store-name">THE EXECUTIVE</div>
                        <div class="info">${user?.franchise?.name || "Premium Store"}</div>
                        <div class="info">${new Date(orderData.createAt || new Date()).toLocaleString()}</div>
                        <div class="info">Order ID: #${orderData.id.substring(0, 8)}...</div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: right">Qty</th>
                                <th style="text-align: right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderData.orderDetails?.map(item => `
                                <tr>
                                    <td>${item.productNameSnapshot}</td>
                                    <td style="text-align: right">x${item.quantity}</td>
                                    <td style="text-align: right">${formatCurrency(item.cost)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    
                    <div class="total-row">
                        <span>TOTAL:</span>
                        <span>${formatCurrency(orderData.totalDue)}</span>
                    </div>
                    
                    <div style="font-size: 11px; margin-top: 10px; color: #555;">
                        Payment: ${orderData.paymentMethod?.name || "Online Payment"}
                    </div>
                    
                    <div class="footer">
                        Thank you for shopping with us!<br/>
                        See you again.
                    </div>
                    
                    <script>
                        window.onload = () => { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `;
        receiptWindow.document.write(receiptHtml);
        receiptWindow.document.close();
    };

    const handleNewOrder = () => {
        const activeTabId = localStorage.getItem("pos_current_paying_tab");
        navigate("/staff/new-order", {
            state: {
                orderCompleted: true,
                completedOrderId: activeTabId ? Number(activeTabId) : null
            }
        });
    };

    const handleRetry = () => {
        const activeTabId = localStorage.getItem("pos_current_paying_tab");
        navigate("/staff/new-order", {
            state: {
                restoredOrderId: activeTabId ? Number(activeTabId) : null
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] overflow-hidden relative">
                <div className="flex flex-col items-center gap-6 z-10">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="font-bold text-gray-400 text-lg uppercase tracking-widest animate-pulse">Đang định danh...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f9fa] relative overflow-hidden font-sans">
            {/* Soft decorative blur */}
            <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]"></div>
            <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]"></div>
            
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center border border-white relative z-10">
                {/* Status Bar */}
                <div className={`w-full h-2 ${isSuccess ? "bg-green-500" : "bg-red-500"}`}></div>

                <div className="p-10 flex flex-col items-center w-full">
                    {/* Status Icon */}
                    <div className={`w-24 h-24 rounded-full ${isSuccess ? "bg-green-50" : "bg-red-50"} flex items-center justify-center mb-6 relative`}>
                        {isSuccess ? (
                            <CheckCircle size={56} className="text-green-500" />
                        ) : (
                            <XCircle size={56} className="text-red-500" />
                        )}
                    </div>

                    {/* Status Message */}
                    <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">
                        {status === "Loading..." ? "Đang xử lý..." : isSuccess ? "Thành công!" : "Thất bại"}
                    </h2>
                    <p className="text-gray-500 text-center mb-10 font-medium italic">
                        {isSuccess 
                            ? "Giao dịch hoàn tất. In hóa đơn và giao hàng." 
                            : "Giao dịch không thành công hoặc đã bị hủy."}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full">
                        {isSuccess && (
                            <button
                                onClick={handlePrintReceipt}
                                className="flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] group"
                            >
                                <Printer size={20} className="group-hover:scale-110 transition-transform" />
                                <span>In Hóa Đơn</span>
                            </button>
                        )}
                        
                        <button
                            onClick={isSuccess ? handleNewOrder : handleRetry}
                            className={`flex items-center justify-center gap-3 py-4 ${isSuccess ? "bg-white border-2 border-primary text-primary hover:bg-primary/5" : "bg-red-500 hover:bg-red-600 text-white shadow-red-100 shadow-xl"} font-bold rounded-2xl transition-all active:scale-[0.98]`}
                        >
                            {isSuccess ? <Plus size={20} /> : <ShoppingBag size={20} />}
                            <span>{isSuccess ? "Tiếp tục bán hàng" : "Quay về POS"}</span>
                        </button>
                    </div>

                    {/* Mini ID Display */}
                    {orderId && (
                        <p className="mt-8 text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                            ID: #{orderId.substring(0, 8)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
