-- Limpieza de cuentas de prueba creadas al verificar las estadísticas.
delete from public.accounts
 where id in (select account_id from public.devices where device_id like 'DEV-TEST-%' or device_id = 'DEV-015AE8BC-TKNEL8')
    or alias in ('StatsTest', 'AmigoPrueba', 'Chef_2279');
