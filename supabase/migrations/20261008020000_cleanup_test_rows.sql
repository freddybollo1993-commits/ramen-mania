-- Limpieza de las cuentas de prueba creadas al verificar el inicio de sesión (alias y dispositivos de prueba).
delete from public.accounts
 where id in (select account_id from public.devices where device_id like 'DEV-TEST-%')
    or alias in ('ChefA', 'ChefB', 'AmigoPrueba', 'Chef_2279');
delete from public.player_progress where device_id like 'TEST-SUMI-%';
