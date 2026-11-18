-- Клуби та проєкти з готовими дошками (нерухомість, крамниця, автосалон) мають бути активними
UPDATE projects SET status = 'active'
WHERE status = 'coming_soon' AND slug IN ('clubs','real-estate','shops','cars');
