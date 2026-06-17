-- 구독 정기 결제 포인트 차감을 지갑 거래 타입으로 분리한다.

alter type public.wallet_transaction_type add value if not exists 'subscription_spend';
