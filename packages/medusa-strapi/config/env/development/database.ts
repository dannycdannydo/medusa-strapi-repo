export default ({ env }) => ({
	connection: {
		client: 'postgres',
		connection: {
		host: env('DATABASE_HOST', 'marshmallow-backend_strapi-db'),
			port: env.int('DATABASE_PORT', 5432),
			database: env('DATABASE_NAME', 'marshmallow-backend'),
			user: env('DATABASE_USERNAME', 'postgres'),
			password: env('DATABASE_PASSWORD', '7ed280258a0d6326a895'),
			ssl: env.bool('DATABASE_SSL', false)
		}
	}
});
